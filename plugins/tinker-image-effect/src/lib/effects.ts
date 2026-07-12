import clamp from 'licia/clamp'
import type {
  AsciiCharset,
  AsciiParams,
  EffectId,
  EffectParamsMap,
  PixelateParams,
  SketchParams,
} from '../types'

const ASCII_CHARSETS: Record<AsciiCharset, string> = {
  simple: ' .:-=+*#%@',
  detailed:
    ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
}

// Fixed ink/paper for ASCII rasterization; independent of app UI theme.
const ASCII_PAPER_LIGHT = '#ffffff'
const ASCII_PAPER_DARK = '#111111'
const ASCII_INK_LIGHT = '#eeeeee'
const ASCII_INK_DARK = '#111111'

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

function applySketch(imageData: ImageData, params: SketchParams): ImageData {
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

function applyPixelate(
  imageData: ImageData,
  params: PixelateParams
): ImageData {
  const { width, height, data } = imageData
  const size = Math.max(2, Math.round(params.pixelSize))
  const out = new ImageData(width, height)
  const dest = out.data

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const blockW = Math.min(size, width - x)
      const blockH = Math.min(size, height - y)
      let r = 0
      let g = 0
      let b = 0
      let count = 0

      for (let by = 0; by < blockH; by++) {
        for (let bx = 0; bx < blockW; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
      }

      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)

      for (let by = 0; by < blockH; by++) {
        for (let bx = 0; bx < blockW; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4
          dest[i] = r
          dest[i + 1] = g
          dest[i + 2] = b
          dest[i + 3] = 255
        }
      }
    }
  }

  return out
}

function applyAscii(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  params: AsciiParams
): void {
  const { width, height, data } = imageData
  const cell = Math.max(4, Math.round(params.cellSize))
  const chars = ASCII_CHARSETS[params.charset]
  const contrastMapped = (params.contrast - 50) * 2.5
  const paper = params.invert ? ASCII_PAPER_LIGHT : ASCII_PAPER_DARK
  const ink = params.invert ? ASCII_INK_DARK : ASCII_INK_LIGHT

  ctx.fillStyle = paper
  ctx.fillRect(0, 0, width, height)
  ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillStyle = ink

  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const blockW = Math.min(cell, width - x)
      const blockH = Math.min(cell, height - y)
      let luma = 0
      let count = 0

      for (let by = 0; by < blockH; by++) {
        for (let bx = 0; bx < blockW; bx++) {
          const i = ((y + by) * width + (x + bx)) * 4
          luma += getLuma(data[i], data[i + 1], data[i + 2])
          count++
        }
      }

      let brightness = luma / count
      brightness = applyContrast(brightness, contrastMapped)
      if (params.invert) brightness = 255 - brightness

      const index = Math.min(
        chars.length - 1,
        Math.floor((brightness / 255) * chars.length)
      )
      ctx.fillText(chars[index], x, y)
    }
  }
}

export function renderEffect(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  effectId: EffectId,
  params: EffectParamsMap
): void {
  const width = source.width
  const height = source.height
  target.width = width
  target.height = height

  const ctx = target.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  if (effectId === 'original') {
    ctx.drawImage(source, 0, 0)
    return
  }

  const sourceCtx = source.getContext('2d')
  if (!sourceCtx) {
    throw new Error('Failed to get source canvas context')
  }

  const imageData = sourceCtx.getImageData(0, 0, width, height)

  if (effectId === 'ascii') {
    applyAscii(ctx, imageData, params.ascii)
    return
  }

  const result =
    effectId === 'sketch'
      ? applySketch(imageData, params.sketch)
      : applyPixelate(imageData, params.pixelate)

  ctx.putImageData(result, 0, 0)
}
