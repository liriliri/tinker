import each from 'licia/each'
import type { Adjustments } from '../types'
import { MIXER_CHANNELS } from '../types/hsl'

export const ADJUSTMENT_SCALES = {
  exposure: 0.8,
  brightness: 0.8,
  contrast: 100,
  highlights: 120,
  shadows: 120,
  whites: 30,
  blacks: 70,
  temperature: 25,
  tint: 100,
  vibrance: 100,
  saturation: 100,
  hslHue: 0.3,
  hslSaturation: 100,
  hslLuminance: 100,
  vignetteAmount: 100,
  vignetteMidpoint: 100,
  vignetteRoundness: 100,
  vignetteFeather: 100,
  grainAmount: 200,
  grainSize: 50,
  grainRoughness: 100,
  sharpness: 50,
  sharpnessThreshold: 100,
  lumaNoiseReduction: 100,
  colorNoiseReduction: 100,
} as const

export interface GpuAdjustments {
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
  hslHue: Float32Array
  hslSat: Float32Array
  hslLum: Float32Array
  hslActive: number
  vignetteAmount: number
  vignetteMidpoint: number
  vignetteRoundness: number
  vignetteFeather: number
  grainAmount: number
  grainSize: number
  grainRoughness: number
  grainScale: number
  sharpness: number
  sharpnessThreshold: number
  lumaNoiseReduction: number
  colorNoiseReduction: number
  detailScale: number
}

export function toGpuAdjustments(
  adjustments: Adjustments,
  imageWidth: number,
  imageHeight: number
): GpuAdjustments {
  const hslHue = new Float32Array(8)
  const hslSat = new Float32Array(8)
  const hslLum = new Float32Array(8)
  let hslActive = 0

  each(MIXER_CHANNELS, (channel, index) => {
    const channelAdjustment = adjustments.hsl[channel]
    const hue = channelAdjustment.hue * ADJUSTMENT_SCALES.hslHue
    const saturation =
      channelAdjustment.saturation / ADJUSTMENT_SCALES.hslSaturation
    const luminance =
      channelAdjustment.luminance / ADJUSTMENT_SCALES.hslLuminance

    hslHue[index] = hue
    hslSat[index] = saturation
    hslLum[index] = luminance

    if (hue !== 0 || saturation !== 0 || luminance !== 0) {
      hslActive = 1
    }
  })

  const referenceDimension = 1080
  const currentRefDim = Math.min(imageWidth, imageHeight)
  const grainScale = Math.max(0.1, currentRefDim / referenceDimension)
  const detailScale = grainScale

  return {
    exposure: adjustments.exposure / ADJUSTMENT_SCALES.exposure,
    brightness: adjustments.brightness / ADJUSTMENT_SCALES.brightness,
    contrast: adjustments.contrast / ADJUSTMENT_SCALES.contrast,
    highlights: adjustments.highlights / ADJUSTMENT_SCALES.highlights,
    shadows: adjustments.shadows / ADJUSTMENT_SCALES.shadows,
    whites: adjustments.whites / ADJUSTMENT_SCALES.whites,
    blacks: adjustments.blacks / ADJUSTMENT_SCALES.blacks,
    temperature: adjustments.temperature / ADJUSTMENT_SCALES.temperature,
    tint: adjustments.tint / ADJUSTMENT_SCALES.tint,
    vibrance: adjustments.vibrance / ADJUSTMENT_SCALES.vibrance,
    saturation: adjustments.saturation / ADJUSTMENT_SCALES.saturation,
    hslHue,
    hslSat,
    hslLum,
    hslActive,
    vignetteAmount:
      adjustments.vignetteAmount / ADJUSTMENT_SCALES.vignetteAmount,
    vignetteMidpoint:
      adjustments.vignetteMidpoint / ADJUSTMENT_SCALES.vignetteMidpoint,
    vignetteRoundness:
      adjustments.vignetteRoundness / ADJUSTMENT_SCALES.vignetteRoundness,
    vignetteFeather:
      adjustments.vignetteFeather / ADJUSTMENT_SCALES.vignetteFeather,
    grainAmount: adjustments.grainAmount / ADJUSTMENT_SCALES.grainAmount,
    grainSize: adjustments.grainSize / ADJUSTMENT_SCALES.grainSize,
    grainRoughness:
      adjustments.grainRoughness / ADJUSTMENT_SCALES.grainRoughness,
    grainScale,
    sharpness: adjustments.sharpness / ADJUSTMENT_SCALES.sharpness,
    sharpnessThreshold:
      adjustments.sharpnessThreshold / ADJUSTMENT_SCALES.sharpnessThreshold,
    lumaNoiseReduction:
      adjustments.lumaNoiseReduction / ADJUSTMENT_SCALES.lumaNoiseReduction,
    colorNoiseReduction:
      adjustments.colorNoiseReduction / ADJUSTMENT_SCALES.colorNoiseReduction,
    detailScale,
  }
}
