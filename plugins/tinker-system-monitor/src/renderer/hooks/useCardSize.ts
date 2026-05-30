import { type RefObject } from 'react'
import { cardSizeFromWidth, type CardSize } from '../lib/cardLayout'
import { useElementWidth } from './useElementWidth'

export function useCardSize(ref: RefObject<HTMLElement | null>): CardSize {
  return useElementWidth<CardSize>(ref, cardSizeFromWidth, 'sm')
}
