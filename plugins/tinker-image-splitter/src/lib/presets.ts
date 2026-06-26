import find from 'licia/find'
import type { SplitPreset } from '../types'

export const SPLIT_PRESETS: SplitPreset[] = [
  { id: '2x1', rows: 1, cols: 2 },
  { id: '1x2', rows: 2, cols: 1 },
  { id: '2x2', rows: 2, cols: 2 },
  { id: '3x3', rows: 3, cols: 3 },
  { id: '3x1', rows: 1, cols: 3 },
  { id: '1x3', rows: 3, cols: 1 },
  { id: '2x3', rows: 2, cols: 3 },
  { id: '3x2', rows: 3, cols: 2 },
  { id: '4x4', rows: 4, cols: 4 },
]

export function getPresetById(id: string): SplitPreset | undefined {
  return find(SPLIT_PRESETS, (preset) => preset.id === id)
}
