import clamp from 'licia/clamp'
import type { SketchParams } from '../types'

export const DEFAULT_SKETCH_PARAMS: SketchParams = {
  thickness: 2,
  brightness: 5,
  detail: 50,
  deepen: 6,
}

export const THICKNESS_RANGE = {
  min: 1,
  max: 10,
  step: 1,
  default: DEFAULT_SKETCH_PARAMS.thickness,
} as const

export const BRIGHTNESS_RANGE = {
  min: 0,
  max: 20,
  step: 1,
  default: DEFAULT_SKETCH_PARAMS.brightness,
} as const

export const DETAIL_RANGE = {
  min: 0,
  max: 50,
  step: 1,
  default: DEFAULT_SKETCH_PARAMS.detail,
} as const

export const DEEPEN_RANGE = {
  min: 0,
  max: 8,
  step: 1,
  default: DEFAULT_SKETCH_PARAMS.deepen,
} as const

function getLuma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function buildGaussKernel(radius: number): Float32Array {
  const sigma = radius / 3
  const a = 1 / (Math.sqrt(2 * Math.PI) * sigma)
  const b = -1 / (2 * sigma * sigma)
  const kernel = new Float32Array(radius * 2 + 1)
  let sum = 0

  for (let i = 0, x = -radius; x <= radius; x++, i++) {
    const g = a * Math.exp(b * x * x)
    kernel[i] = g
    sum += g
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum
  }

  return kernel
}

function gaussBlurGray(
  src: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  if (radius <= 0) return new Float32Array(src)

  const kernel = buildGaussKernel(radius)
  const tmp = new Float32Array(src.length)
  const dest = new Float32Array(src.length)

  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < width; x++) {
      let value = 0
      let weightSum = 0
      for (let j = -radius; j <= radius; j++) {
        const k = x + j
        if (k < 0 || k >= width) continue
        const weight = kernel[j + radius]
        value += src[row + k] * weight
        weightSum += weight
      }
      tmp[row + x] = value / weightSum
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let value = 0
      let weightSum = 0
      for (let j = -radius; j <= radius; j++) {
        const k = y + j
        if (k < 0 || k >= height) continue
        const weight = kernel[j + radius]
        value += tmp[k * width + x] * weight
        weightSum += weight
      }
      dest[y * width + x] = value / weightSum
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

  const inverted = new Float32Array(gray.length)
  for (let p = 0; p < gray.length; p++) {
    inverted[p] = 255 - gray[p]
  }

  const thickness = Math.max(1, Math.round(params.thickness))
  const blurred = gaussBlurGray(inverted, width, height, thickness)

  const detailThreshold = 205 + params.detail
  const deepen = Math.max(0, Math.round(params.deepen))
  const brightness = params.brightness
  const result = new Float32Array(gray.length)

  for (let p = 0; p < gray.length; p++) {
    const blend = blurred[p]
    let pixel = blend >= 255 ? 255 : gray[p] + (gray[p] * blend) / (255 - blend)

    // Deepen before brightness so line pixels are not lifted past the threshold.
    if (pixel < detailThreshold) {
      for (let j = 0; j < deepen; j++) {
        pixel = (pixel * pixel) / 255
        if (pixel < 5) break
      }
    }

    pixel += brightness
    // Subtle source-tone mix: dark regions get slightly heavier lines,
    // without turning the result into a grayscale photo.
    pixel *= 0.88 + 0.12 * (gray[p] / 255)
    result[p] = clamp(pixel, 0, 255)
  }

  const softened = gaussBlurGray(result, width, height, 2)
  const out = new ImageData(width, height)
  const dest = out.data

  for (let p = 0, i = 0; p < softened.length; p++, i += 4) {
    const value = softened[p]
    dest[i] = value
    dest[i + 1] = value
    dest[i + 2] = value
    dest[i + 3] = 255
  }

  return out
}
