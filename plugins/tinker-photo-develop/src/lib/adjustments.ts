import { cloneCurves, isDefaultCurves, isRgbCurvesActive } from './curves'
import { cloneHslAdjustments, isDefaultHslAdjustments } from './hsl'
import {
  DEFAULT_ADJUSTMENTS,
  getDefaultCurves,
  type Adjustments,
} from '../types'

export function cloneAdjustments(adjustments: Adjustments): Adjustments {
  return {
    ...adjustments,
    curves: cloneCurves(adjustments.curves),
    hsl: cloneHslAdjustments(adjustments.hsl),
  }
}

export function createDefaultAdjustments(): Adjustments {
  return cloneAdjustments({
    ...DEFAULT_ADJUSTMENTS,
    curves: getDefaultCurves(),
  })
}

export function hasNonDefaultAdjustments(adjustments: Adjustments): boolean {
  if (adjustments.exposure !== 0) return true
  if (adjustments.brightness !== 0) return true
  if (adjustments.contrast !== 0) return true
  if (adjustments.highlights !== 0) return true
  if (adjustments.shadows !== 0) return true
  if (adjustments.whites !== 0) return true
  if (adjustments.blacks !== 0) return true
  if (adjustments.temperature !== 0) return true
  if (adjustments.tint !== 0) return true
  if (adjustments.vibrance !== 0) return true
  if (adjustments.saturation !== 0) return true
  if (!isDefaultHslAdjustments(adjustments.hsl)) return true
  if (adjustments.sharpness !== 0) return true
  if (adjustments.sharpnessThreshold !== 15) return true
  if (adjustments.lumaNoiseReduction !== 0) return true
  if (adjustments.colorNoiseReduction !== 0) return true
  if (adjustments.vignetteAmount !== 0) return true
  if (adjustments.vignetteMidpoint !== 50) return true
  if (adjustments.vignetteRoundness !== 0) return true
  if (adjustments.vignetteFeather !== 50) return true
  if (adjustments.grainAmount !== 0) return true
  if (adjustments.grainSize !== 25) return true
  if (adjustments.grainRoughness !== 50) return true
  if (!isDefaultCurves(adjustments.curves)) return true
  return false
}

export function isRgbCurveModeActive(adjustments: Adjustments): boolean {
  return isRgbCurvesActive(adjustments.curves)
}
