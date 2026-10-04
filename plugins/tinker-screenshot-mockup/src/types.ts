export type DeviceCategory = 'phone' | 'tablet' | 'pc'

export interface DeviceMeta {
  id: DeviceCategory
  width: number
  height: number
}

export type BackgroundType = 'solid' | 'gradient' | 'transparent' | 'image'

export interface BackgroundConfig {
  type: BackgroundType
  solidColor: string
  gradientName: string
  gradientAngle: number
  gradientColors: string[]
  imageUrl: string | null
}

export interface ShadowConfig {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
}

export type FrameStyle = 'default' | 'none'

export interface SceneObject {
  id: string
  deviceId: DeviceCategory
  screenshotUrl: string | null
  x: number
  y: number
  scale: number
  rotation: number
  shadow: ShadowConfig
  frameStyle: FrameStyle
  borderRadius: number
}

export interface CanvasSize {
  width: number
  height: number
  presetName: string
}

export interface CanvasPreset {
  name: string
  width: number
  height: number
}

export interface GradientPreset {
  name: string
  angle: number
  colors: string[]
}
