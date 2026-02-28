export type Photo = {
  id: string
  url: string
  file: File
}

export type LayoutTemplate = {
  id: string
  photoCount: number
  gridTemplate: string
  gridAreas: string
  areas: string[]
}

export type PhotoSlot = {
  areaName: string
  photoId: string | null
  scale: number
  offsetX: number
  offsetY: number
}
