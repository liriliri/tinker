import type { RuleType, Rule } from '../common/types'

export interface FileRow {
  fullPath: string
  index: number
  original: string
  newName: string
  changed: boolean
}

export interface RuleRow {
  id: string
  index: number
  type: RuleType
  description: string
  enabled: boolean
  rule: Rule
}
