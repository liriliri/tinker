export type ActionType = 'command' | 'app' | 'directory' | 'url' | 'plugin'

export type FilterTab = 'all' | ActionType

export interface Action {
  id: string
  name: string
  hotkey: string
  enabled: boolean
  type: ActionType
  command: string
  appIcon?: string
}

export type ActionInput = Omit<Action, 'id'>
