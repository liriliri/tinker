export interface CleanRule {
  id: string
  category: Category
  nameKey: string
  path: string
  size: number
  scanned: boolean
}

export type Category =
  | 'system'
  | 'userCache'
  | 'systemLog'
  | 'appCache'
  | 'browser'
