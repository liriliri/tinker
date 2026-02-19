export type ImageFormat = 'jpeg' | 'png' | 'webp'

export interface ImageItem {
  id: string
  fileName: string
  filePath?: string
  originalFormat: ImageFormat
  originalImage: HTMLImageElement
  originalSize: number
  originalUrl: string
  compressedBlob: Blob | null
  compressedSize: number
  compressedDataUrl: string
  isCompressing: boolean
  isSaved: boolean
}
