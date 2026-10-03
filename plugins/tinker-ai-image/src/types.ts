export type TaskStatus = 'wait' | 'generating'

export interface GalleryImage {
  id: string
  path: string
  bytes: number
  prompt: string
  provider: string
  model: string
  size: string
}

export interface GenTask {
  id: string
  status: TaskStatus
  prompt: string
  count: number
}

export interface ReferenceImageTab {
  id: string
  title: string
  path: string
}

export interface GenSettings {
  prompt: string
  provider: string
  model: string
  width: number
  height: number
  count: number
  outputDir: string
  imageListItemSize: number
}

export const DEFAULT_SETTINGS: GenSettings = {
  prompt: '',
  provider: '',
  model: '',
  width: 1024,
  height: 1024,
  count: 1,
  outputDir: '',
  imageListItemSize: 112,
}

/** Providers require area >= 960² (921600). */
export const IMAGE_SIZE_MIN = 960
export const IMAGE_SIZE_MAX = 2048
export const IMAGE_COUNT_MIN = 1
export const IMAGE_COUNT_MAX = 4
export const IMAGE_LIST_ITEM_SIZE_MIN = 50
export const IMAGE_LIST_ITEM_SIZE_MAX = 256
export const REFERENCE_IMAGE_MAX = 4
