import type { MediaItem } from '../types'
import splitPath from 'licia/splitPath'
import { resolveSavePath } from 'share/lib/util'

function getVideoCodecArgs(outputFormat: string): string[] {
  switch (outputFormat) {
    case 'webm':
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
    case 'gif':
      return [
        '-vf',
        'fps=15,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop',
        '0',
      ]
    case 'ts':
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
    default:
      // mp4, mkv, avi, mov, flv, m4v, 3gp
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
    if (outputFormat === 'gif') {
      // palette-based GIF conversion — no audio stream
      args.push(
        '-vf',
        'fps=15,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop',
        '0'
      )
    } else {
      args.push(...getVideoCodecArgs(outputFormat))
    }
    if (outputFormat === 'mp4' || outputFormat === 'm4v') {
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
  const outExt = '.' + outputFormat

  if (outputDir) {
    return resolveSavePath(`${outputDir}/${baseName}${outExt}`)
  }

  return resolveSavePath(`${dir}${baseName}${outExt}`)
}
