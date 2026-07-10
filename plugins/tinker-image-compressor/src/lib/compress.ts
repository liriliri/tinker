import clamp from 'licia/clamp'
import type { ImageFormat } from '../types'

export const MIN_QUALITY = 1
export const MAX_QUALITY = 99

export const QUALITY_PRESETS = [
  { labelKey: 'qualityVeryLow', value: 20 },
  { labelKey: 'qualityLow', value: 40 },
  { labelKey: 'qualityMedium', value: 60 },
  { labelKey: 'qualityHigh', value: 80 },
  { labelKey: 'qualityExcellent', value: 95 },
]

export const PRESET_QUALITIES = QUALITY_PRESETS.map((preset) => preset.value)

export function clampQuality(quality: number): number {
  return clamp(quality, MIN_QUALITY, MAX_QUALITY)
}

interface FfmpegArgsOptions {
  filePath: string
  outputPath: string
  format: ImageFormat
  quality: number
  keepExif: boolean
}

export function detectImageFormat(fileName: string): ImageFormat {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  if (ext === 'png') return 'png'
  if (ext === 'webp') return 'webp'
  return 'jpeg'
}

export function getFormatExtension(format: ImageFormat): string {
  switch (format) {
    case 'jpeg':
      return 'jpg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
  }
}

export function getCompressionRatio(
  originalSize: number,
  compressedSize: number
): string {
  return Math.abs((1 - compressedSize / originalSize) * 100).toFixed(1)
}

export function buildFfmpegArgs({
  filePath,
  outputPath,
  format,
  quality,
  keepExif,
}: FfmpegArgsOptions): string[] {
  const args = ['-i', filePath]

  switch (format) {
    case 'jpeg':
      args.push(
        '-q:v',
        String(2 + Math.round((100 - quality) * 0.29)),
        '-huffman',
        'optimal',
        '-pix_fmt',
        quality >= 90 ? 'yuvj444p' : 'yuvj420p'
      )
      break

    case 'png':
      {
        const maxColors = Math.max(16, Math.round((quality / 100) * 256))
        args.push(
          '-vf',
          `split[a][b];[a]palettegen=max_colors=${maxColors}:stats_mode=single[p];[b][p]paletteuse=dither=sierra2_4a`
        )
      }
      args.push('-compression_level', '9')
      break

    case 'webp':
      args.push('-q:v', String(quality))
      args.push('-preset', quality >= 80 ? 'photo' : 'default')
      args.push(
        '-compression_level',
        String(Math.min(6, Math.round((quality / 100) * 6)))
      )
      if (quality >= 80) {
        args.push('-auto-alt-ref', '1')
      }
      break
  }

  // mjpeg encoder doesn't support EXIF output, handle it manually after compression
  if (keepExif && format !== 'jpeg') {
    args.push('-map_metadata', '0')
  } else {
    args.push('-map_metadata', '-1')
  }

  args.push('-y', outputPath)

  return args
}
