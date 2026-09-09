export type ActionType = 'command' | 'app' | 'directory' | 'url' | 'plugin'

export type InvokeMode = 'alwaysOn' | 'middleClick'

export type SlotRing = 'inner' | 'outer'

export interface SlotAction {
  id: string
  name: string
  enabled: boolean
  type: ActionType
  command: string
  appIcon?: string
}

export type SlotActionInput = Omit<SlotAction, 'id'>

export const INNER_SLOT_COUNT = 8
export const OUTER_SLOT_COUNT = 16

export const PIE_SIZE = 320

export const INNER_RING_RATIO = 0.4
export const OUTER_RING_RATIO = 0.22

export function pieCanvasSize(dualRing: boolean, base = PIE_SIZE) {
  if (!dualRing) return base
  const midR = base * INNER_RING_RATIO
  const rimR = midR + base * OUTER_RING_RATIO
  return Math.ceil(rimR * 2 + 4)
}

/** Floating pie window always uses dual-ring canvas size (no resize on toggle). */
export const DUAL_PIE_SIZE = pieCanvasSize(true)

export const BALL_SIZE = Math.round(PIE_SIZE * 0.16)

export const RING_ANIM_MS = 200

export interface ScreenPoint {
  x: number
  y: number
}

export type Slots = Array<SlotAction | null>
