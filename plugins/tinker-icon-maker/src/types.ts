export const CANVAS_SIZE = 1024

export type PlatformId = 'ios' | 'android' | 'macos' | 'windows'

export type EditorSectionId = 'icon' | 'shadow' | 'background' | 'shape'

export const EDITOR_SECTION_IDS: EditorSectionId[] = [
  'icon',
  'shadow',
  'background',
  'shape',
]

export type SectionOpenState = Record<EditorSectionId, boolean>

export const DEFAULT_SECTION_OPEN: SectionOpenState = {
  icon: true,
  shadow: false,
  background: true,
  shape: true,
}

export interface IconConfig {
  size: number
  imageScale: number
  rotate: number
  offsetX: number
  offsetY: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOpacity: number
  shadowOffsetY: number
}

export interface BackgroundConfig {
  transparent: boolean
  color: string
  useGradient: boolean
  gradientEnd: string
  gradientAngle: number
  rounded: number
  squircle: number
  padding: number
}

export interface ThemePreset {
  id: string
  nameKey: string
  icon: IconConfig
  background: BackgroundConfig
}

export interface BackgroundColorPreset {
  id: string
  color: string
  gradientEnd?: string
  gradientAngle?: number
}

export interface PlatformExportSpec {
  id: PlatformId
  nameKey: string
  sizes: number[]
  folder: string
}

export interface SourceImage {
  fileName: string
  url: string
}
