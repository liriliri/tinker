export interface ImageInfo {
  fileName: string
  filePath?: string
  originalUrl: string
  originalSize: number
  width: number
  height: number
}

export interface CropRegion {
  left: number
  top: number
  width: number
  height: number
}

export interface CellRect {
  index: number
  row: number
  col: number
  left: number
  top: number
  width: number
  height: number
}

export interface SplitPreset {
  id: string
  rows: number
  cols: number
}

export interface CellPreview {
  index: number
  url: string
}

export interface DisplayCellLayout {
  index: number
  left: number
  top: number
  width: number
  height: number
}

export type CropHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
