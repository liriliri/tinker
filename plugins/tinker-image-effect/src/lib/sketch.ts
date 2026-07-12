import clamp from 'licia/clamp'
import type { SketchParams } from '../types'

function getLuma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function applyContrast(value: number, contrast: number): number {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  return clamp(factor * (value - 128) + 128, 0, 255)
}

function boxBlurGray(
  src: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  if (radius <= 0) return new Float32Array(src)

  const dest = new Float32Array(src.length)
  const tmp = new Float32Array(src.length)
  const size = radius * 2 + 1

  for (let y = 0; y < height; y++) {
    let sum = 0
    for (let x = -radius; x <= radius; x++) {
      sum += src[y * width + clamp(x, 0, width - 1)]
    }
    for (let x = 0; x < width; x++) {
      tmp[y * width + x] = sum / size
      const remove = src[y * width + clamp(x - radius, 0, width - 1)]
      const add = src[y * width + clamp(x + radius + 1, 0, width - 1)]
      sum += add - remove
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let y = -radius; y <= radius; y++) {
      sum += tmp[clamp(y, 0, height - 1) * width + x]
    }
    for (let y = 0; y < height; y++) {
      dest[y * width + x] = sum / size
      const remove = tmp[clamp(y - radius, 0, height - 1) * width + x]
      const add = tmp[clamp(y + radius + 1, 0, height - 1) * width + x]
      sum += add - remove
    }
  }

  return dest
}

export function applySketch(
  imageData: ImageData,
  params: SketchParams
): ImageData {
  const { width, height, data } = imageData
  const gray = new Float32Array(width * height)

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = getLuma(data[i], data[i + 1], data[i + 2])
  }

  const radius = Math.max(1, Math.round(1 + ((100 - params.detail) / 100) * 8))
  const blurred = boxBlurGray(
    Float32Array.from(gray, (v) => 255 - v),
    width,
    height,
    radius
  )

  const contrastMapped = (params.contrast - 50) * 2.5
  const out = new ImageData(width, height)
  const dest = out.data

  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const base = gray[p]
    const blend = blurred[p]
    let value =
      blend >= 255 ? 255 : Math.min(255, (base * 255) / (255 - blend + 1e-4))
    value = applyContrast(value, contrastMapped)
    dest[i] = value
    dest[i + 1] = value
    dest[i + 2] = value
    dest[i + 3] = 255
  }

  return out
}
