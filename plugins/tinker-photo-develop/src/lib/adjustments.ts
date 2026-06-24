import { cloneCurves, isDefaultCurves } from './curves'
import { cloneHslAdjustments, isDefaultHslAdjustments } from './hsl'
import {
  DEFAULT_ADJUSTMENTS,
  getDefaultCurves,
  type Adjustments,
} from '../types'

const MAX_ADJUSTMENT_HISTORY = 50

export interface AdjustmentHistoryState {
  history: Adjustments[]
  index: number
}

export function cloneAdjustments(adjustments: Adjustments): Adjustments {
  return {
    ...adjustments,
    curves: cloneCurves(adjustments.curves),
    hsl: cloneHslAdjustments(adjustments.hsl),
  }
}

export function createDefaultAdjustments(): Adjustments {
  return cloneAdjustments({
    ...DEFAULT_ADJUSTMENTS,
    curves: getDefaultCurves(),
  })
}

export function hasNonDefaultAdjustments(adjustments: Adjustments): boolean {
  if (adjustments.exposure !== 0) return true
  if (adjustments.brightness !== 0) return true
  if (adjustments.contrast !== 0) return true
  if (adjustments.highlights !== 0) return true
  if (adjustments.shadows !== 0) return true
  if (adjustments.whites !== 0) return true
  if (adjustments.blacks !== 0) return true
  if (adjustments.temperature !== 0) return true
  if (adjustments.tint !== 0) return true
  if (adjustments.vibrance !== 0) return true
  if (adjustments.saturation !== 0) return true
  if (!isDefaultHslAdjustments(adjustments.hsl)) return true
  if (adjustments.sharpness !== 0) return true
  if (adjustments.sharpnessThreshold !== 15) return true
  if (adjustments.lumaNoiseReduction !== 0) return true
  if (adjustments.colorNoiseReduction !== 0) return true
  if (adjustments.vignetteAmount !== 0) return true
  if (adjustments.vignetteMidpoint !== 50) return true
  if (adjustments.vignetteRoundness !== 0) return true
  if (adjustments.vignetteFeather !== 50) return true
  if (adjustments.grainAmount !== 0) return true
  if (adjustments.grainSize !== 25) return true
  if (adjustments.grainRoughness !== 50) return true
  if (!isDefaultCurves(adjustments.curves)) return true
  return false
}

export function createAdjustmentHistory(
  initial: Adjustments
): AdjustmentHistoryState {
  return {
    history: [cloneAdjustments(initial)],
    index: 0,
  }
}

export function pushAdjustmentHistory(
  state: AdjustmentHistoryState,
  adjustments: Adjustments
): AdjustmentHistoryState {
  const snapshot = cloneAdjustments(adjustments)
  let history = state.history.slice(0, state.index + 1)
  history.push(snapshot)
  if (history.length > MAX_ADJUSTMENT_HISTORY) {
    history = history.slice(history.length - MAX_ADJUSTMENT_HISTORY)
  }
  return {
    history,
    index: history.length - 1,
  }
}

export function undoAdjustmentHistory(
  state: AdjustmentHistoryState
): AdjustmentHistoryState | null {
  if (state.index <= 0) return null
  return {
    history: state.history,
    index: state.index - 1,
  }
}

export function redoAdjustmentHistory(
  state: AdjustmentHistoryState
): AdjustmentHistoryState | null {
  if (state.index >= state.history.length - 1) return null
  return {
    history: state.history,
    index: state.index + 1,
  }
}

export function canUndoAdjustmentHistory(
  state: AdjustmentHistoryState
): boolean {
  return state.index > 0
}

export function canRedoAdjustmentHistory(
  state: AdjustmentHistoryState
): boolean {
  return state.index < state.history.length - 1
}
