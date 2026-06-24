import mapObj from 'licia/mapObj'
import some from 'licia/some'
import type { HslAdjustments, MixerChannel } from '../types/hsl'

const MIXER_SWATCH_COLORS: Record<MixerChannel, string> = {
  reds: '#f87171',
  oranges: '#fb923c',
  yellows: '#facc15',
  greens: '#4ade80',
  aquas: '#2dd4bf',
  blues: '#60a5fa',
  purples: '#a78bfa',
  magentas: '#f472b6',
}

export function cloneHslAdjustments(hsl: HslAdjustments): HslAdjustments {
  return mapObj(hsl, (adjustment) => ({ ...adjustment })) as HslAdjustments
}

export function isDefaultHslAdjustments(hsl: HslAdjustments): boolean {
  return !some(
    hsl,
    (adjustment) =>
      adjustment.hue !== 0 ||
      adjustment.saturation !== 0 ||
      adjustment.luminance !== 0
  )
}

const MIXER_BASE_HUES: Record<MixerChannel, number> = {
  reds: 0,
  oranges: 30,
  yellows: 60,
  greens: 120,
  aquas: 180,
  blues: 240,
  purples: 300,
  magentas: 340,
}

export function getMixerEffectiveHue(
  channel: MixerChannel,
  hueOffset: number
): number {
  const baseHue = MIXER_BASE_HUES[channel]
  return (((baseHue + hueOffset) % 360) + 360) % 360
}

export function getMixerEffectiveSaturation(saturation: number): number {
  return (saturation + 100) / 2
}

export function getMixerTrackClassName(
  channel: MixerChannel,
  key: 'hue' | 'saturation' | 'luminance'
): string {
  if (key === 'hue') {
    return `hue-slider-${channel}`
  }

  if (key === 'saturation') {
    return 'sat-slider-mixer'
  }

  return 'lum-slider-mixer'
}

export function getMixerSwatchColor(channel: MixerChannel): string {
  return MIXER_SWATCH_COLORS[channel]
}
