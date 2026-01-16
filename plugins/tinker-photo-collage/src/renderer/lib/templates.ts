import { LayoutTemplate } from '../store'
import { templates1to5 } from './templates-2-5'
import { templates6to10 } from './templates-6-10'
import { templates11to16 } from './templates-11-16'

export const templates: LayoutTemplate[] = [
  ...templates1to5,
  ...templates6to10,
  ...templates11to16,
]

export const getTemplatesByPhotoCount = (count: number): LayoutTemplate[] => {
  return templates.filter((t) => t.photoCount === count)
}

export const getTemplateById = (id: string): LayoutTemplate | undefined => {
  return templates.find((t) => t.id === id)
}
