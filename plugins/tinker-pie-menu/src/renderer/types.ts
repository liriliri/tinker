export type ActionType = 'command' | 'app' | 'directory' | 'url' | 'plugin'

export type InvokeMode = 'alwaysOn' | 'middleClick'

export interface SlotAction {
  id: string
  name: string
  enabled: boolean
  type: ActionType
  command: string
  appIcon?: string
}

export type SlotActionInput = Omit<SlotAction, 'id'>

export const SLOT_COUNT = 8

export type Slots = Array<SlotAction | null>
