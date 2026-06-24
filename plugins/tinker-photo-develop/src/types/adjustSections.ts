export type AdjustSectionId =
  | 'basic'
  | 'curves'
  | 'color'
  | 'colorMixer'
  | 'effects'
  | 'details'

export const ADJUST_SECTION_IDS: AdjustSectionId[] = [
  'basic',
  'curves',
  'color',
  'colorMixer',
  'effects',
  'details',
]

export type SectionOpenState = Record<AdjustSectionId, boolean>

export const DEFAULT_SECTION_OPEN: SectionOpenState = {
  basic: true,
  curves: false,
  color: false,
  colorMixer: false,
  effects: false,
  details: false,
}
