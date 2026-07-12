export interface ImageInfo {
  fileName: string
  filePath?: string
  width: number
  height: number
}

export type EffectId = 'sketch' | 'pixelate' | 'ascii'

export interface SketchParams {
  detail: number
  contrast: number
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

export interface EffectDefinition {
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

export const DEFAULT_SKETCH_PARAMS: SketchParams = {
  detail: 50,
  contrast: 50,
}

export const DEFAULT_PIXELATE_PARAMS: PixelateParams = {
  pixelSize: 12,
  paletteEnabled: false,
  palette: 'pico8',
  outline: false,
}

export const DEFAULT_ASCII_PARAMS: AsciiParams = {
  cellSize: 8,
  contrast: 50,
  invert: false,
  charset: 'detailed',
}

export function createDefaultEffectParams(): EffectParamsMap {
  return {
    sketch: { ...DEFAULT_SKETCH_PARAMS },
    pixelate: { ...DEFAULT_PIXELATE_PARAMS },
    ascii: { ...DEFAULT_ASCII_PARAMS },
  }
}

export function cloneEffectParams(params: EffectParamsMap): EffectParamsMap {
  return {
    sketch: { ...params.sketch },
    pixelate: { ...params.pixelate },
    ascii: { ...params.ascii },
  }
}

export const DETAIL_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: DEFAULT_SKETCH_PARAMS.detail,
} as const

export const CONTRAST_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: 50,
} as const

export const PIXEL_SIZE_RANGE = {
  min: 2,
  max: 48,
  step: 1,
  default: DEFAULT_PIXELATE_PARAMS.pixelSize,
} as const

export const CELL_SIZE_RANGE = {
  min: 4,
  max: 24,
  step: 1,
  default: DEFAULT_ASCII_PARAMS.cellSize,
} as const
