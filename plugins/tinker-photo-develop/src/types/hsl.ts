export type MixerChannel =
  | 'reds'
  | 'oranges'
  | 'yellows'
  | 'greens'
  | 'aquas'
  | 'blues'
  | 'purples'
  | 'magentas'

export interface HslChannelAdjustment {
  hue: number
  saturation: number
  luminance: number
}

export type HslAdjustments = Record<MixerChannel, HslChannelAdjustment>

export const MIXER_CHANNELS: MixerChannel[] = [
  'reds',
  'oranges',
  'yellows',
  'greens',
  'aquas',
  'blues',
  'purples',
  'magentas',
]

const DEFAULT_CHANNEL: HslChannelAdjustment = {
  hue: 0,
  saturation: 0,
  luminance: 0,
}

export function getDefaultHslAdjustments(): HslAdjustments {
  return {
    reds: { ...DEFAULT_CHANNEL },
    oranges: { ...DEFAULT_CHANNEL },
    yellows: { ...DEFAULT_CHANNEL },
    greens: { ...DEFAULT_CHANNEL },
    aquas: { ...DEFAULT_CHANNEL },
    blues: { ...DEFAULT_CHANNEL },
    purples: { ...DEFAULT_CHANNEL },
    magentas: { ...DEFAULT_CHANNEL },
  }
}

export type MixerAdjustmentKey = keyof HslChannelAdjustment
