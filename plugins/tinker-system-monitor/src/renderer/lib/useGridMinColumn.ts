import { type RefObject } from 'react'
import { gridMinColumn } from './cardLayout'
import { useElementWidth } from './useElementWidth'

export function useGridMinColumn(ref: RefObject<HTMLElement | null>): number {
  return useElementWidth<number>(ref, gridMinColumn, 176)
}
