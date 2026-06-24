import { cloneAdjustments } from './adjustments'
import type { Adjustments } from '../types'

const MAX_ADJUSTMENT_HISTORY = 50

export interface AdjustmentHistoryState {
  history: Adjustments[]
  index: number
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
