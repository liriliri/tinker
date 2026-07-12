export interface ImageInfo {
  fileName: string
  filePath?: string
  width: number
  height: number
}

export type EffectId = 'sketch' | 'pixelate' | 'ascii'

export interface SketchParams {
  thickness: number
  brightness: number
  detail: number
  deepen: number
}

export type PixelPaletteId =
  | 'pico8'
  | 'lostCentury'
  | 'sunset8'
  | 'twilight5'
  | 'gameboy'
  | 'retroNes'
  | 'cyberpunk'
  | 'monochrome'
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'candy'

export interface PixelateParams {
  pixelSize: number
  paletteEnabled: boolean
  palette: PixelPaletteId
  outline: boolean
}

export type AsciiCharset = 'simple' | 'detailed' | 'blocks'

export interface AsciiParams {
  cellSize: number
  contrast: number
  invert: boolean
  charset: AsciiCharset
}

export interface EffectParamsMap {
  sketch: SketchParams
  pixelate: PixelateParams
  ascii: AsciiParams
}

interface EffectDefinition {
  id: EffectId
  nameKey: string
}

export const EFFECTS: EffectDefinition[] = [
  { id: 'sketch', nameKey: 'effectSketch' },
  { id: 'pixelate', nameKey: 'effectPixelate' },
  { id: 'ascii', nameKey: 'effectAscii' },
]

export const ASCII_CHARSET_OPTIONS: {
  value: AsciiCharset
  labelKey: string
}[] = [
  { value: 'simple', labelKey: 'charsetSimple' },
  { value: 'detailed', labelKey: 'charsetDetailed' },
  { value: 'blocks', labelKey: 'charsetBlocks' },
]

export const PIXEL_PALETTE_OPTIONS: {
  value: PixelPaletteId
  labelKey: string
}[] = [
  { value: 'pico8', labelKey: 'palettePico8' },
  { value: 'lostCentury', labelKey: 'paletteLostCentury' },
  { value: 'sunset8', labelKey: 'paletteSunset8' },
  { value: 'twilight5', labelKey: 'paletteTwilight5' },
  { value: 'gameboy', labelKey: 'paletteGameboy' },
  { value: 'retroNes', labelKey: 'paletteRetroNes' },
  { value: 'cyberpunk', labelKey: 'paletteCyberpunk' },
  { value: 'monochrome', labelKey: 'paletteMonochrome' },
  { value: 'sunset', labelKey: 'paletteSunset' },
  { value: 'ocean', labelKey: 'paletteOcean' },
  { value: 'forest', labelKey: 'paletteForest' },
  { value: 'candy', labelKey: 'paletteCandy' },
]
