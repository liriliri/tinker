import clamp from 'licia/clamp'
import type { AsciiCharset, AsciiParams } from '../types'
import { getLuma } from './util'

export const DEFAULT_ASCII_PARAMS: AsciiParams = {
  cellSize: 8,
  contrast: 50,
  invert: false,
  charset: 'detailed',
}

export const CELL_SIZE_RANGE = {
  min: 4,
  max: 24,
  step: 1,
  default: DEFAULT_ASCII_PARAMS.cellSize,
} as const

export const CONTRAST_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: DEFAULT_ASCII_PARAMS.contrast,
} as const

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

function applyContrast(value: number, contrast: number): number {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  return clamp(factor * (value - 128) + 128, 0, 255)
}

export function applyAscii(
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
