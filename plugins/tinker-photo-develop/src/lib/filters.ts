import { cloneAdjustments, createDefaultAdjustments } from './adjustments'
import { MIXER_CHANNELS } from '../types/hsl'
import type { Adjustments } from '../types'
import type { HslAdjustments, MixerChannel } from '../types/hsl'

export interface PhotoFilter {
  id: string
  nameKey: string
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: 'original', nameKey: 'filterOriginal' },
  { id: 'sepia', nameKey: 'filterSepia' },
  { id: 'clarendon', nameKey: 'filterClarendon' },
  { id: 'skyline', nameKey: 'filterSkyline' },
  { id: 'loFi', nameKey: 'filterLoFi' },
  { id: 'lark', nameKey: 'filterLark' },
  { id: 'reyes', nameKey: 'filterReyes' },
  { id: 'slumber', nameKey: 'filterSlumber' },
  { id: 'ludwig', nameKey: 'filterLudwig' },
  { id: 'mayfair', nameKey: 'filterMayfair' },
  { id: 'hudson', nameKey: 'filterHudson' },
  { id: 'valencia', nameKey: 'filterValencia' },
  { id: 'xPro2', nameKey: 'filterXPro2' },
  { id: 'inkwell', nameKey: 'filterInkwell' },
  { id: 'kelvin', nameKey: 'filterKelvin' },
  { id: 'brannan', nameKey: 'filterBrannan' },
  { id: 'sutro', nameKey: 'filterSutro' },
]

type HslPatch = Partial<
  Record<MixerChannel, Partial<HslAdjustments[MixerChannel]>>
>

interface FilterPatch {
  exposure?: number
  brightness?: number
  contrast?: number
  highlights?: number
  shadows?: number
  whites?: number
  blacks?: number
  temperature?: number
  tint?: number
  vibrance?: number
  saturation?: number
  sharpness?: number
  vignetteAmount?: number
  vignetteMidpoint?: number
  grainAmount?: number
  grainSize?: number
  hsl?: HslPatch
}

const FILTER_PATCHES: Record<string, FilterPatch> = {
  sepia: { temperature: 38, tint: 12, saturation: -28 },
  clarendon: {
    exposure: 0.04,
    brightness: 0.22,
    contrast: 12,
    saturation: 15,
    vibrance: 5,
  },
  skyline: {
    saturation: 35,
    vibrance: 12,
    brightness: 0.22,
    exposure: 0.04,
  },
  loFi: { contrast: 18, saturation: 20, vibrance: 7 },
  lark: {
    exposure: 0.03,
    brightness: 0.18,
    temperature: -8,
    tint: 2,
    saturation: 12,
    vibrance: 4,
  },
  reyes: {
    temperature: 15,
    tint: 5,
    saturation: -11,
    brightness: 0.29,
    exposure: 0.05,
    contrast: -6,
  },
  slumber: {
    brightness: 0.22,
    exposure: 0.04,
    saturation: -50,
    vibrance: -18,
  },
  ludwig: { brightness: 0.11, exposure: 0.02, saturation: -3 },
  mayfair: { temperature: 8, tint: -2, saturation: 15, vibrance: 2 },
  hudson: {
    temperature: -44,
    tint: 4,
    contrast: 12,
    brightness: 0.33,
    exposure: 0.05,
  },
  valencia: {
    temperature: 28,
    tint: 6,
    saturation: 10,
    vibrance: 3,
    contrast: 6,
  },
  xPro2: {
    temperature: 25,
    tint: 8,
    saturation: 20,
    vibrance: 7,
    contrast: 18,
  },
  inkwell: { saturation: -100 },
  kelvin: {
    temperature: 55,
    tint: 8,
    saturation: 35,
    vibrance: 12,
    exposure: 0.05,
  },
  brannan: { temperature: 46, tint: -5, contrast: 24, vibrance: 2 },
  sutro: {
    brightness: -0.22,
    exposure: -0.04,
    saturation: -10,
    vibrance: -4,
  },
}

function applyHslPatch(hsl: HslAdjustments, patch?: HslPatch): HslAdjustments {
  if (!patch) return hsl

  const next = { ...hsl }
  for (const channel of MIXER_CHANNELS) {
    if (patch[channel]) {
      next[channel] = { ...next[channel], ...patch[channel] }
    }
  }
  return next
}

export function createFilterAdjustments(filterId: string): Adjustments {
  if (filterId === 'original') {
    return createDefaultAdjustments()
  }

  const patch = FILTER_PATCHES[filterId]
  if (!patch) {
    return createDefaultAdjustments()
  }

  const { hsl: hslPatch, ...scalarPatch } = patch
  const base = createDefaultAdjustments()

  return cloneAdjustments({
    ...base,
    ...scalarPatch,
    hsl: applyHslPatch(base.hsl, hslPatch),
  })
}
