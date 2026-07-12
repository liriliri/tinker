import type { PixelPaletteId, PixelateParams } from '../types'

interface RgbColor {
  r: number
  g: number
  b: number
}

const PALETTE_HEX: Record<PixelPaletteId, string[]> = {
  pico8: [
    '#000000',
    '#1D2B53',
    '#7E2553',
    '#008751',
    '#AB5236',
    '#5F574F',
    '#C2C3C7',
    '#FFF1E8',
    '#FF004D',
    '#FFA300',
    '#FFEC27',
    '#00E436',
    '#29ADFF',
    '#83769C',
    '#FF77A8',
    '#FFCCAA',
  ],
  lostCentury: [
    '#d1b187',
    '#c77b58',
    '#ae5d40',
    '#79444a',
    '#4b3d44',
    '#ba9158',
    '#927441',
    '#4d4539',
    '#77743b',
    '#b3a555',
    '#d2c9a5',
    '#8caba1',
    '#4b726e',
    '#574852',
    '#847875',
    '#ab9b8e',
  ],
  sunset8: [
    '#FFF474',
    '#F3B05A',
    '#F4874B',
    '#F06553',
    '#A3586D',
    '#5C4A72',
    '#3C3B5F',
    '#3C3B5F',
  ],
  twilight5: ['#fbbbad', '#ee8695', '#4a7a96', '#333f58', '#292831'],
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  retroNes: ['#000000', '#fcfcfc', '#f83800', '#7c7c7c'],
  cyberpunk: ['#0d0221', '#ff00ff', '#00ffff', '#ffff00'],
  monochrome: ['#000000', '#555555', '#aaaaaa', '#ffffff'],
  sunset: ['#1a1423', '#ff6b35', '#f7c59f', '#004e64'],
  ocean: ['#03071e', '#0077b6', '#00b4d8', '#90e0ef'],
  forest: ['#1b4332', '#2d6a4f', '#52b788', '#95d5b2'],
  candy: ['#ff0a54', '#ff477e', '#ff85a1', '#fbb1bd'],
}

function parseHexColor(hex: string): RgbColor | null {
  const raw = hex.replace('#', '')
  if (raw.length === 3) {
    return {
      r: parseInt(raw[0] + raw[0], 16),
      g: parseInt(raw[1] + raw[1], 16),
      b: parseInt(raw[2] + raw[2], 16),
    }
  }
  if (raw.length === 6) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    }
  }
  return null
}

function buildPalette(hexColors: string[]): RgbColor[] {
  const colors: RgbColor[] = []
  for (const hex of hexColors) {
    const color = parseHexColor(hex)
    if (color) colors.push(color)
  }
  return colors
}

const PALETTE_RGB: Record<PixelPaletteId, RgbColor[]> = Object.fromEntries(
  Object.entries(PALETTE_HEX).map(([id, colors]) => [id, buildPalette(colors)])
) as Record<PixelPaletteId, RgbColor[]>

function getPaletteColors(id: PixelPaletteId): RgbColor[] {
  return PALETTE_RGB[id]
}

export function getPaletteHexColors(id: PixelPaletteId): string[] {
  return PALETTE_HEX[id]
}

function nearestPaletteColor(
  r: number,
  g: number,
  b: number,
  palette: RgbColor[]
): RgbColor {
  let best = palette[0]
  let bestDist = Infinity

  for (let i = 0; i < palette.length; i++) {
    const color = palette[i]
    const dr = r - color.r
    const dg = g - color.g
    const db = b - color.b
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      best = color
    }
  }

  return best
}

function quantizeToPalette(data: Uint8ClampedArray, paletteId: PixelPaletteId) {
  const palette = getPaletteColors(paletteId)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const nearest = nearestPaletteColor(
      data[i],
      data[i + 1],
      data[i + 2],
      palette
    )
    data[i] = nearest.r
    data[i + 1] = nearest.g
    data[i + 2] = nearest.b
  }
}

function applyAlphaOutline(
  data: Uint8ClampedArray,
  width: number,
  height: number
) {
  const copy = new Uint8ClampedArray(data)
  const neighbors = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] !== 0) continue

      let adjacent = false
      for (const [dx, dy] of neighbors) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        if (data[(ny * width + nx) * 4 + 3] > 0) {
          adjacent = true
          break
        }
      }

      if (adjacent) {
        copy[i] = 0
        copy[i + 1] = 0
        copy[i + 2] = 0
        copy[i + 3] = 255
      }
    }
  }

  data.set(copy)
}

export function applyPixelate(
  source: HTMLCanvasElement,
  params: PixelateParams
): ImageData {
  const width = source.width
  const height = source.height
  const size = Math.max(2, Math.round(params.pixelSize))
  const cellsX = Math.max(1, Math.round(width / size))
  const cellsY = Math.max(1, Math.round(height / size))

  const small = document.createElement('canvas')
  small.width = cellsX
  small.height = cellsY
  const smallCtx = small.getContext('2d')
  if (!smallCtx) {
    throw new Error('Failed to get pixelate canvas context')
  }

  smallCtx.imageSmoothingEnabled = false
  smallCtx.clearRect(0, 0, cellsX, cellsY)
  smallCtx.drawImage(source, 0, 0, cellsX, cellsY)

  if (params.paletteEnabled || params.outline) {
    const imageData = smallCtx.getImageData(0, 0, cellsX, cellsY)
    if (params.paletteEnabled) {
      quantizeToPalette(imageData.data, params.palette)
    }
    if (params.outline) {
      applyAlphaOutline(imageData.data, cellsX, cellsY)
    }
    smallCtx.putImageData(imageData, 0, 0)
  }

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const outCtx = out.getContext('2d')
  if (!outCtx) {
    throw new Error('Failed to get pixelate output canvas context')
  }

  outCtx.imageSmoothingEnabled = false
  outCtx.clearRect(0, 0, width, height)
  outCtx.drawImage(small, 0, 0, width, height)

  return outCtx.getImageData(0, 0, width, height)
}
