import type { MediaItem } from '../types'
import splitPath from 'licia/splitPath'
import { resolveSavePath } from 'share/lib/util'
import { VIDEO_OUTPUT_FORMATS } from './constants'

function getVideoCodecArgs(codec: string, ext: string): string[] {
  switch (codec) {
    case 'vp9':
      return [
        '-c:v',
        'libvpx-vp9',
        '-crf',
        '23',
        '-b:v',
        '0',
        '-deadline',
        'good',
        '-cpu-used',
        '2',
        '-c:a',
        'libopus',
      ]
    case 'vp8':
      return ['-c:v', 'libvpx', '-crf', '10', '-b:v', '1M', '-c:a', 'libvorbis']
    case 'av1':
      return [
        '-c:v',
        'libsvtav1',
        '-crf',
        '30',
        '-preset',
        '6',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
      ]
    case 'prores':
      return ['-c:v', 'prores_ks', '-profile:v', '3', '-c:a', 'pcm_s16le']
    case 'xvid':
      return [
        '-c:v',
        'libxvid',
        '-vtag',
        'xvid',
        '-qscale:v',
        '4',
        '-c:a',
        'mp3',
        '-b:a',
        '128k',
      ]
    case 'mpeg4':
      return [
        '-c:v',
        'mpeg4',
        '-vtag',
        'xvid',
        '-qscale:v',
        '4',
        '-c:a',
        'mp3',
        '-b:a',
        '128k',
      ]
    case 'sorenson':
      return ['-c:v', 'flv', '-qscale:v', '4', '-c:a', 'mp3', '-b:a', '128k']
    case 'wmv2':
      return ['-c:v', 'wmv2', '-qscale:v', '4', '-c:a', 'wmav2', '-b:a', '128k']
    case 'h263':
      return [
        '-c:v',
        'h263',
        '-s',
        '176x144',
        '-r',
        '15',
        '-b:v',
        '128k',
        '-c:a',
        'aac',
        '-b:a',
        '32k',
        '-ar',
        '8000',
        '-ac',
        '1',
      ]
    case 'h265':
      if (ext === 'ts') {
        return [
          '-c:v',
          'libx265',
          '-preset',
          'medium',
          '-crf',
          '23',
          '-c:a',
          'aac',
        ]
      }
      return [
        '-c:v',
        'libx265',
        '-preset',
        'medium',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
      ]
    default:
      // h264
      if (ext === 'ts') {
        return [
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-crf',
          '23',
          '-c:a',
          'aac',
        ]
      }
      return [
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
      ]
  }
}

function getAudioCodecArgs(outputFormat: string): string[] {
  switch (outputFormat) {
    case 'mp3':
      return ['-c:a', 'libmp3lame', '-q:a', '2']
    case 'ogg':
      return ['-c:a', 'libvorbis', '-q:a', '4']
    case 'opus':
      return ['-c:a', 'libopus', '-b:a', '128k']
    case 'flac':
      return ['-c:a', 'flac']
    case 'wav':
      return ['-c:a', 'pcm_s16le']
    case 'aac':
      return ['-c:a', 'aac', '-b:a', '192k']
    case 'm4a':
      return ['-c:a', 'aac', '-b:a', '192k']
    default:
      return ['-c:a', 'aac', '-b:a', '192k']
  }
}

function getImageCodecArgs(outputFormat: string): string[] {
  switch (outputFormat) {
    case 'jpg':
    case 'jpeg':
      return ['-q:v', '2']
    case 'png':
      return ['-compression_level', '6']
    case 'webp':
      return ['-q:v', '80']
    case 'avif':
      return [
        '-c:v',
        'libaom-av1',
        '-still-picture',
        '1',
        '-crf',
        '30',
        '-b:v',
        '0',
      ]
    case 'bmp':
    case 'tiff':
    default:
      return []
  }
}

export function buildFFmpegArgs(
  item: MediaItem,
  outputPath: string,
  outputFormat: string
): string[] {
  const args = ['-i', item.filePath]

  if (item.mediaType === 'video') {
    const fmt = VIDEO_OUTPUT_FORMATS.find((f) => f.value === outputFormat)
    const ext = fmt?.ext ?? outputFormat
    const codec = fmt?.codec ?? 'h264'

    if (ext === 'gif') {
      // palette-based GIF conversion — no audio stream
      args.push(
        '-vf',
        'fps=15,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop',
        '0'
      )
    } else {
      args.push(...getVideoCodecArgs(codec, ext))
    }
    if (ext === 'mp4' || ext === 'm4v') {
      args.push('-movflags', '+faststart')
    }
  } else if (item.mediaType === 'audio') {
    args.push(...getAudioCodecArgs(outputFormat))
    args.push('-vn')
  } else if (item.mediaType === 'image') {
    args.push('-frames:v', '1')
    const codecArgs = getImageCodecArgs(outputFormat)
    if (codecArgs.length > 0) {
      args.push(...codecArgs)
    }
  }

  args.push('-y', outputPath)
  return args
}

export async function getOutputPath(
  item: MediaItem,
  outputDir: string,
  outputFormat: string
): Promise<string> {
  const { dir, name, ext } = splitPath(item.filePath)
  const baseName = ext ? name.slice(0, -ext.length) : name

  const fmt = VIDEO_OUTPUT_FORMATS.find((f) => f.value === outputFormat)
  const outExt = '.' + (fmt?.ext ?? outputFormat)

  if (outputDir) {
    return resolveSavePath(`${outputDir}/${baseName}${outExt}`)
  }

  return resolveSavePath(`${dir}${baseName}${outExt}`)
}
