export type CardSize = 'sm' | 'md' | 'lg'

export const CARD_LAYOUT = {
  sm: {
    height: 104,
    ringCol: 92,
    ring: 62,
    stroke: 5,
    icon: 12,
    labelClass: 'text-[8px]',
    statsClass: 'text-[9px]',
    detailClass: 'text-[8px]',
    chartPad: 'p-0.5',
  },
  md: {
    height: 120,
    ringCol: 100,
    ring: 74,
    stroke: 5,
    icon: 14,
    labelClass: 'text-[9px]',
    statsClass: 'text-[10px]',
    detailClass: 'text-[9px]',
    chartPad: 'p-1',
  },
  lg: {
    height: 140,
    ringCol: 112,
    ring: 88,
    stroke: 6,
    icon: 16,
    labelClass: 'text-[10px]',
    statsClass: 'text-[11px]',
    detailClass: 'text-[10px]',
    chartPad: 'p-1.5',
  },
} as const

export function cardSizeFromWidth(width: number): CardSize {
  if (width >= 280) return 'lg'
  if (width >= 220) return 'md'
  return 'sm'
}

export function gridMinColumn(width: number): number {
  if (width >= 960) return 220
  if (width >= 640) return 200
  return 176
}
