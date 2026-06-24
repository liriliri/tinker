export type SharpeningAdjustmentKey = 'sharpness' | 'sharpnessThreshold'

export type NoiseReductionAdjustmentKey =
  | 'lumaNoiseReduction'
  | 'colorNoiseReduction'

export type DetailsAdjustmentKey =
  | SharpeningAdjustmentKey
  | NoiseReductionAdjustmentKey
