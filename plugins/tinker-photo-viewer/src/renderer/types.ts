import type { PhotoExif } from '../common/types'

export interface Photo {
  id: string
  path: string
  title: string
  width: number
  height: number
  size: number
  createdAt: number
  updatedAt: number
  dateSection: string
  format: string
  exif?: PhotoExif
}

export interface PhotoSection {
  id: string
  label: string
  photos: Photo[]
}
