export interface PhotoExif {
  make?: string
  model?: string
  camera?: string
  iso?: number
  aperture?: number
  exposureTime?: number
  focalLength?: number
  takenAt?: number
}

export interface PhotoMeta {
  path: string
  size: number
  width: number
  height: number
  createdAt: number
  updatedAt: number
  format: string
  exif?: PhotoExif
}

export interface ThumbnailResult {
  url: string
  width: number
  height: number
  takenAt?: number
}

export interface PreviewResult {
  url: string
  width: number
  height: number
}
