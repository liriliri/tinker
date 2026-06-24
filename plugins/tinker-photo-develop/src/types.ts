export interface ImageInfo {
  fileName: string
  filePath?: string
  width: number
  height: number
}

export type { CurveChannel, CurvePoint, Curves } from './types/curves'
export type {
  HslAdjustments,
  HslChannelAdjustment,
  MixerAdjustmentKey,
  MixerChannel,
} from './types/hsl'

export { getDefaultCurves } from './types/curves'
export { getDefaultHslAdjustments, MIXER_CHANNELS } from './types/hsl'

export type { EffectsAdjustmentKey } from './types/effects'

export type { DetailsAdjustmentKey } from './types/details'

import { getDefaultCurves, type Curves } from './types/curves'
import type { DetailsAdjustmentKey } from './types/details'
import type { EffectsAdjustmentKey } from './types/effects'
import { getDefaultHslAdjustments, type HslAdjustments } from './types/hsl'

export type BasicAdjustmentKey =
  | 'exposure'
  | 'brightness'
  | 'contrast'
  | 'highlights'
  | 'shadows'
  | 'whites'
  | 'blacks'

export type ColorAdjustmentKey =
  | 'temperature'
  | 'tint'
  | 'vibrance'
  | 'saturation'

export type ScalarAdjustmentKey =
  | BasicAdjustmentKey
  | ColorAdjustmentKey
  | EffectsAdjustmentKey
  | DetailsAdjustmentKey

export interface Adjustments {
  exposure: number
  brightness: number
  contrast: number
  highlights: number
  shadows: number
  whites: number
  blacks: number
  temperature: number
  tint: number
  vibrance: number
  saturation: number
  hsl: HslAdjustments
  sharpness: number
  sharpnessThreshold: number
  lumaNoiseReduction: number
  colorNoiseReduction: number
  vignetteAmount: number
  vignetteMidpoint: number
  vignetteRoundness: number
  vignetteFeather: number
  grainAmount: number
  grainSize: number
  grainRoughness: number
  curves: Curves
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  hsl: getDefaultHslAdjustments(),
  sharpness: 0,
  sharpnessThreshold: 15,
  lumaNoiseReduction: 0,
  colorNoiseReduction: 0,
  vignetteAmount: 0,
  vignetteMidpoint: 50,
  vignetteRoundness: 0,
  vignetteFeather: 50,
  grainAmount: 0,
  grainSize: 25,
  grainRoughness: 50,
  curves: getDefaultCurves(),
}

export const EXPOSURE_RANGE = {
  min: -5,
  max: 5,
  step: 0.01,
  default: 0,
} as const

export const BRIGHTNESS_RANGE = {
  min: -5,
  max: 5,
  step: 0.01,
  default: 0,
} as const

export const TONAL_RANGE = {
  min: -100,
  max: 100,
  step: 1,
  default: 0,
} as const

export const COLOR_RANGE = {
  min: -100,
  max: 100,
  step: 1,
  default: 0,
} as const

export const VIGNETTE_AMOUNT_RANGE = {
  min: -100,
  max: 100,
  step: 1,
  default: 0,
} as const

export const VIGNETTE_ROUNDNESS_RANGE = {
  min: -100,
  max: 100,
  step: 1,
  default: 0,
} as const

export const VIGNETTE_MIDPOINT_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: 50,
} as const

export const VIGNETTE_FEATHER_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: 50,
} as const

export const GRAIN_AMOUNT_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: 0,
} as const

export const GRAIN_SIZE_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: 25,
} as const

export const GRAIN_ROUGHNESS_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: 50,
} as const

export const SHARPNESS_RANGE = {
  min: -100,
  max: 100,
  step: 1,
  default: 0,
} as const

export const SHARPNESS_THRESHOLD_RANGE = {
  min: 0,
  max: 80,
  step: 1,
  default: 15,
} as const

export const NOISE_REDUCTION_RANGE = {
  min: 0,
  max: 100,
  step: 1,
  default: 0,
} as const
