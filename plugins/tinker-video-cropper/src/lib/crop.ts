import clamp from 'licia/clamp'
import type { CropRegion } from '../types'

function evenFloor(n: number) {
  return Math.floor(n / 2) * 2
}

export function normalizeCropRegion(
  region: CropRegion,
  videoWidth: number,
  videoHeight: number
): CropRegion {
  const maxWidth = Math.max(2, evenFloor(videoWidth))
  const maxHeight = Math.max(2, evenFloor(videoHeight))

  let width = evenFloor(Math.round(region.width))
  let height = evenFloor(Math.round(region.height))
  let x = evenFloor(Math.round(region.x))
  let y = evenFloor(Math.round(region.y))

  width = clamp(width, 2, maxWidth)
  height = clamp(height, 2, maxHeight)
  x = clamp(x, 0, Math.max(0, videoWidth - width))
  y = clamp(y, 0, Math.max(0, videoHeight - height))
  x = evenFloor(x)
  y = evenFloor(y)

  if (x + width > videoWidth) {
    width = Math.max(2, evenFloor(videoWidth - x))
  }
  if (y + height > videoHeight) {
    height = Math.max(2, evenFloor(videoHeight - y))
  }

  return { x, y, width, height }
}

export function buildCropFfmpegArgs(
  inputPath: string,
  outputPath: string,
  region: CropRegion
) {
  return [
    '-y',
    '-i',
    inputPath,
    '-vf',
    `crop=${region.width}:${region.height}:${region.x}:${region.y}`,
    '-c:a',
    'copy',
    outputPath,
  ]
}
