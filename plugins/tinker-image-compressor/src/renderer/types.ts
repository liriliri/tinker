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

export interface EmscriptenWasmModule {
  HEAP8: Int8Array
  HEAP16: Int16Array
  HEAP32: Int32Array
  HEAPU8: Uint8Array
  HEAPU16: Uint16Array
  HEAPU32: Uint32Array
  HEAPF32: Float32Array
  HEAPF64: Float64Array
}

export interface EmscriptenWasmModuleFactory<T extends EmscriptenWasmModule> {
  (config?: EmscriptenWasmModuleFactoryConfig): Promise<T>
}

export interface EmscriptenWasmModuleFactoryConfig {
  locateFile?: (path: string) => string
  mainScriptUrlOrBlob?: string
}
