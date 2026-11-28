import clamp from 'licia/clamp'
import isBool from 'licia/isBool'
import isNum from 'licia/isNum'
import isStr from 'licia/isStr'
import type { BackgroundConfig, IconConfig } from '../types'

/**
 * Editable range of every numeric adjustment, in the unit it is stored in.
 * The sliders and the store clamps both read these so they cannot drift apart.
 */
export const ICON_LIMITS = {
  size: { min: 20, max: 100 },
  imageScale: { min: 50, max: 350 },
  rotate: { min: -180, max: 180 },
  offsetX: { min: -50, max: 50 },
  offsetY: { min: -50, max: 50 },
  shadowBlur: { min: 0, max: 60 },
  shadowOpacity: { min: 0, max: 100 },
  shadowOffsetY: { min: -40, max: 40 },
} as const

export const BACKGROUND_LIMITS = {
  gradientAngle: { min: 0, max: 360 },
  rounded: { min: 0, max: 100 },
  squircle: { min: 0, max: 1 },
  padding: { min: 0, max: 30 },
} as const

/** Squircle is stored as a 0..1 ratio but edited as a percentage. */
export const SQUIRCLE_PERCENT = 100

function numberOr(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  return isNum(value) ? clamp(value, min, max) : fallback
}

/** Merge a partial icon update into `base`, clamping and validating every field. */
export function applyIconPartial(
  base: IconConfig,
  partial: Partial<IconConfig>
): IconConfig {
  const limits = ICON_LIMITS
  return {
    ...base,
    ...partial,
    size: numberOr(partial.size, base.size, limits.size.min, limits.size.max),
    imageScale: numberOr(
      partial.imageScale,
      base.imageScale,
      limits.imageScale.min,
      limits.imageScale.max
    ),
    rotate: numberOr(
      partial.rotate,
      base.rotate,
      limits.rotate.min,
      limits.rotate.max
    ),
    offsetX: numberOr(
      partial.offsetX,
      base.offsetX,
      limits.offsetX.min,
      limits.offsetX.max
    ),
    offsetY: numberOr(
      partial.offsetY,
      base.offsetY,
      limits.offsetY.min,
      limits.offsetY.max
    ),
    shadowEnabled: isBool(partial.shadowEnabled)
      ? partial.shadowEnabled
      : base.shadowEnabled,
    shadowColor: isStr(partial.shadowColor)
      ? partial.shadowColor
      : base.shadowColor,
    shadowBlur: numberOr(
      partial.shadowBlur,
      base.shadowBlur,
      limits.shadowBlur.min,
      limits.shadowBlur.max
    ),
    shadowOpacity: numberOr(
      partial.shadowOpacity,
      base.shadowOpacity,
      limits.shadowOpacity.min,
      limits.shadowOpacity.max
    ),
    shadowOffsetY: numberOr(
      partial.shadowOffsetY,
      base.shadowOffsetY,
      limits.shadowOffsetY.min,
      limits.shadowOffsetY.max
    ),
  }
}

/** Merge a partial background update into `base`, clamping and validating every field. */
export function applyBackgroundPartial(
  base: BackgroundConfig,
  partial: Partial<BackgroundConfig>
): BackgroundConfig {
  const limits = BACKGROUND_LIMITS
  return {
    ...base,
    ...partial,
    transparent: isBool(partial.transparent)
      ? partial.transparent
      : base.transparent,
    color: isStr(partial.color) ? partial.color : base.color,
    useGradient: isBool(partial.useGradient)
      ? partial.useGradient
      : base.useGradient,
    gradientEnd: isStr(partial.gradientEnd)
      ? partial.gradientEnd
      : base.gradientEnd,
    gradientAngle: numberOr(
      partial.gradientAngle,
      base.gradientAngle,
      limits.gradientAngle.min,
      limits.gradientAngle.max
    ),
    rounded: numberOr(
      partial.rounded,
      base.rounded,
      limits.rounded.min,
      limits.rounded.max
    ),
    squircle: numberOr(
      partial.squircle,
      base.squircle,
      limits.squircle.min,
      limits.squircle.max
    ),
    padding: numberOr(
      partial.padding,
      base.padding,
      limits.padding.min,
      limits.padding.max
    ),
  }
}
