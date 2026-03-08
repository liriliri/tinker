import { LayoutTemplate } from '../types'
import filter from 'licia/filter'
import find from 'licia/find'
import { templates1to5 } from './templates-2-5'
import { templates6to10 } from './templates-6-10'
import { templates11to16 } from './templates-11-16'

export const templates: LayoutTemplate[] = [
  ...templates1to5,
  ...templates6to10,
  ...templates11to16,
]

export const getTemplatesByPhotoCount = (count: number): LayoutTemplate[] => {
  return filter(templates, (t) => t.photoCount === count)
}

export const getTemplateById = (id: string): LayoutTemplate | undefined => {
  return find(templates, (t) => t.id === id)
}
