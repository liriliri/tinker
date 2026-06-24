export type VignetteAdjustmentKey =
  | 'vignetteAmount'
  | 'vignetteMidpoint'
  | 'vignetteRoundness'
  | 'vignetteFeather'

export type GrainAdjustmentKey = 'grainAmount' | 'grainSize' | 'grainRoughness'

export type EffectsAdjustmentKey = VignetteAdjustmentKey | GrainAdjustmentKey
