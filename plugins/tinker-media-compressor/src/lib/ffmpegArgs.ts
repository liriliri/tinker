import clamp from 'licia/clamp'
import type {
  MediaItem,
  VideoCompressionMode,
  AudioCompressionMode,
} from '../types'
import {
  VIDEO_CRF_PRESETS,
  VIDEO_QUALITY_PERCENTAGES,
  AUDIO_BITRATE_PRESETS,
  AUDIO_SAMPLERATE_PRESETS,
  AUDIO_SAMPLERATE_BITRATES,
} from './constants'

// Maps CRF (0-51, lower=better) to VideoToolbox q:v (0-100, higher=better)
function crfToQv(crf: number): number {
  return Math.round(clamp(65 - (crf - 15) * 2.75, 1, 100))
}

function buildGpuCrfArgs(gpuEncoder: string, crf: number): string[] {
  switch (gpuEncoder) {
    case 'h264_videotoolbox':
      return [
        '-c:v',
        'h264_videotoolbox',
        '-q:v',
        String(crfToQv(crf)),
        '-c:a',
        'aac',
        '-b:a',
        '128k',
      ]
    case 'h264_nvenc':
      return [
        '-c:v',
        'h264_nvenc',
        '-cq',
        String(crf),
        '-preset',
        'p4',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
      ]
    case 'h264_qsv':
      return [
        '-c:v',
        'h264_qsv',
        '-global_quality',
        String(crf),
        '-look_ahead',
        '1',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
      ]
    case 'h264_amf':
      return [
        '-c:v',
        'h264_amf',
        '-quality',
        'quality',
        '-qp_i',
        String(crf),
        '-qp_p',
        String(crf),
        '-c:a',
        'aac',
        '-b:a',
        '128k',
      ]
    default:
      return []
  }
}

function buildCrfArgs(
  isVP9: boolean,
  crf: number,
  gpuEncoder?: string | null
): string[] {
  if (isVP9) {
    // -deadline good -cpu-used 2 balances encoding speed and quality for VP9
    return [
      '-c:v',
      'libvpx-vp9',
      '-crf',
      String(crf),
      '-b:v',
      '0',
      '-deadline',
      'good',
      '-cpu-used',
      '2',
      '-row-mt',
      '1',
      '-c:a',
      'libopus',
      '-b:a',
      '128k',
    ]
  }

  if (gpuEncoder) {
    return buildGpuCrfArgs(gpuEncoder, crf)
  }

  // -preset slow improves compression ~5-10% over default; yuv420p ensures broad device compatibility
  return [
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
  ]
}

function buildGpuBitrateArgs(
  gpuEncoder: string,
  targetBitrate: number,
  maxrate: number,
  bufsize: number
): string[] {
  const bitrateArgs = [
    '-b:v',
    `${targetBitrate}k`,
    '-maxrate',
    `${maxrate}k`,
    '-bufsize',
    `${bufsize}k`,
    '-c:a',
    'aac',
    '-b:a',
    '128k',
  ]
  switch (gpuEncoder) {
    case 'h264_videotoolbox':
      return ['-c:v', 'h264_videotoolbox', ...bitrateArgs]
    case 'h264_nvenc':
      return [
        '-c:v',
        'h264_nvenc',
        '-preset',
        'p4',
        '-pix_fmt',
        'yuv420p',
        ...bitrateArgs,
      ]
    case 'h264_qsv':
      return ['-c:v', 'h264_qsv', ...bitrateArgs]
    case 'h264_amf':
      return ['-c:v', 'h264_amf', ...bitrateArgs]
    default:
      return []
  }
}

export interface FFmpegArgsOptions {
  videoMode: VideoCompressionMode
  audioMode: AudioCompressionMode
  quality: number
  gpuEncoder?: string | null
}

export function buildFFmpegArgs(
  item: MediaItem,
  outputPath: string,
  { videoMode, audioMode, quality, gpuEncoder }: FFmpegArgsOptions
): string[] {
  const args = ['-i', item.filePath]

  if (item.mediaType === 'video') {
    // Use source codec to select output codec rather than relying on file extension
    const videoCodec = item.videoInfo?.codec || ''
    const isVP9 = videoCodec === 'vp9' || videoCodec === 'vp8'
    // VP9 has no widely available hardware encoder; only accelerate H.264
    const gpu = isVP9 ? null : gpuEncoder ?? null

    if (videoMode === 'crf') {
      const crf = VIDEO_CRF_PRESETS[quality]
      args.push(...buildCrfArgs(isVP9, crf, gpu))
    } else if (videoMode === 'bitrate') {
      const percentage = VIDEO_QUALITY_PERCENTAGES[quality]
      const originalBitrate = item.videoInfo?.bitrate || 0

      if (originalBitrate > 0) {
        const targetBitrate = Math.round((originalBitrate * percentage) / 100)
        const maxrate = Math.round(targetBitrate * 1.5)
        const bufsize = targetBitrate * 2

        if (isVP9) {
          // VBR: allow 1.5x burst headroom for complex scenes; -deadline good -cpu-used 2 for speed/quality balance
          args.push(
            '-c:v',
            'libvpx-vp9',
            '-b:v',
            `${targetBitrate}k`,
            '-maxrate',
            `${maxrate}k`,
            '-bufsize',
            `${bufsize}k`,
            '-deadline',
            'good',
            '-cpu-used',
            '2',
            '-row-mt',
            '1',
            '-c:a',
            'libopus',
            '-b:a',
            '128k'
          )
        } else if (gpu) {
          args.push(
            ...buildGpuBitrateArgs(gpu, targetBitrate, maxrate, bufsize)
          )
        } else {
          // VBR: remove -minrate to allow encoder to go below target for simple content
          args.push(
            '-c:v',
            'libx264',
            '-preset',
            'slow',
            '-b:v',
            `${targetBitrate}k`,
            '-maxrate',
            `${maxrate}k`,
            '-bufsize',
            `${bufsize}k`,
            '-pix_fmt',
            'yuv420p',
            '-c:a',
            'aac',
            '-b:a',
            '128k'
          )
        }
      } else {
        const crf = VIDEO_CRF_PRESETS[quality]
        args.push(...buildCrfArgs(isVP9, crf, gpu))
      }
    } else if (videoMode === 'resolution') {
      const percentage = VIDEO_QUALITY_PERCENTAGES[quality]
      const originalWidth = item.videoInfo?.width || 0
      const originalHeight = item.videoInfo?.height || 0
      const originalBitrate = item.videoInfo?.bitrate || 0

      if (originalWidth > 0 && originalHeight > 0) {
        const targetWidth = Math.round((originalWidth * percentage) / 100)
        const targetHeight = Math.round((originalHeight * percentage) / 100)
        const evenWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1
        const evenHeight =
          targetHeight % 2 === 0 ? targetHeight : targetHeight - 1

        if (originalBitrate > 0) {
          const targetBitrate = Math.round((originalBitrate * percentage) / 100)
          const maxrate = Math.round(targetBitrate * 1.5)
          const bufsize = targetBitrate * 2

          if (isVP9) {
            // Lanczos downscaling preserves sharpness better than default bilinear
            args.push(
              '-vf',
              `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
              '-c:v',
              'libvpx-vp9',
              '-b:v',
              `${targetBitrate}k`,
              '-maxrate',
              `${maxrate}k`,
              '-bufsize',
              `${bufsize}k`,
              '-deadline',
              'good',
              '-cpu-used',
              '2',
              '-row-mt',
              '1',
              '-c:a',
              'libopus',
              '-b:a',
              '128k'
            )
          } else if (gpu) {
            args.push(
              '-vf',
              `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
              ...buildGpuBitrateArgs(gpu, targetBitrate, maxrate, bufsize)
            )
          } else {
            args.push(
              '-vf',
              `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
              '-c:v',
              'libx264',
              '-preset',
              'slow',
              '-b:v',
              `${targetBitrate}k`,
              '-maxrate',
              `${maxrate}k`,
              '-bufsize',
              `${bufsize}k`,
              '-pix_fmt',
              'yuv420p',
              '-c:a',
              'aac',
              '-b:a',
              '128k'
            )
          }
        } else {
          const crf = VIDEO_CRF_PRESETS[quality]
          if (isVP9) {
            args.push(
              '-vf',
              `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
              '-c:v',
              'libvpx-vp9',
              '-crf',
              String(crf),
              '-b:v',
              '0',
              '-deadline',
              'good',
              '-cpu-used',
              '2',
              '-row-mt',
              '1',
              '-c:a',
              'libopus',
              '-b:a',
              '128k'
            )
          } else if (gpu) {
            args.push(
              '-vf',
              `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
              ...buildGpuCrfArgs(gpu, crf)
            )
          } else {
            args.push(
              '-vf',
              `scale=${evenWidth}:${evenHeight}:flags=lanczos`,
              '-c:v',
              'libx264',
              '-preset',
              'slow',
              '-crf',
              String(crf),
              '-pix_fmt',
              'yuv420p',
              '-c:a',
              'aac',
              '-b:a',
              '128k'
            )
          }
        }
      } else {
        const crf = VIDEO_CRF_PRESETS[quality]
        args.push(...buildCrfArgs(isVP9, crf, gpu))
      }
    }
  } else {
    // Map source codec to output encoder; format stays the same as input
    const audioCodec = item.audioInfo?.codec || ''
    let encoder: string
    if (audioCodec === 'mp3') {
      encoder = 'libmp3lame'
    } else if (audioCodec === 'vorbis') {
      encoder = 'libvorbis'
    } else if (audioCodec === 'flac') {
      encoder = 'flac'
    } else if (audioCodec.startsWith('pcm_')) {
      encoder = 'pcm_s16le'
    } else {
      encoder = 'aac'
    }
    // Lossless codecs (flac, pcm) don't support bitrate control
    const isLossless = audioCodec === 'flac' || audioCodec.startsWith('pcm_')

    if (audioMode === 'bitrate') {
      const bitrate = AUDIO_BITRATE_PRESETS[quality]
      if (isLossless) {
        args.push('-c:a', encoder)
      } else {
        args.push('-c:a', encoder, '-b:a', bitrate)
      }
    } else if (audioMode === 'samplerate') {
      const sampleRate = AUDIO_SAMPLERATE_PRESETS[quality]
      const bitrate = AUDIO_SAMPLERATE_BITRATES[quality]
      if (isLossless) {
        args.push('-ar', String(sampleRate), '-c:a', encoder)
      } else {
        args.push('-ar', String(sampleRate), '-c:a', encoder, '-b:a', bitrate)
      }
    }
  }

  // Move MP4 metadata to the front of file for progressive web playback
  if (item.mediaType === 'video' && outputPath.toLowerCase().endsWith('.mp4')) {
    args.push('-movflags', '+faststart')
  }

  args.push('-y', outputPath)
  return args
}
