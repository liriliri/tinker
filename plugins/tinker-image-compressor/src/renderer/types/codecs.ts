export type ImageFormat = 'jpeg' | 'png' | 'webp'

export interface CompressOptions {
  format: ImageFormat
  quality: number
}

export interface ImageData {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface CompressResult {
  data: Uint8Array
  size: number
}

export interface ImageItem {
  id: string
  fileName: string
  filePath?: string // Original file path for overwriting
  originalFormat: ImageFormat
  originalImage: HTMLImageElement
  originalImageData: ImageData
  originalSize: number
  originalUrl: string
  compressedBlob: Blob | null
  compressedSize: number
  compressedDataUrl: string
  isCompressing: boolean
  isSaved: boolean
}
