export type RuleType = 'replace' | 'insert' | 'delete' | 'format' | 'template'

export type FormatType =
  | 'upper'
  | 'lower'
  | 'capitalize'
  | 'kebabCase'
  | 'snakeCase'
  | 'camelCase'
  | 'upperFirst'

export type InsertPosition = 'prefix' | 'suffix'

export interface ReplaceInfo {
  match: string
  replace: string
  useRegExp: boolean
  caseSensitive: boolean
  matchAll: boolean
  includeExt: boolean
}

export interface InsertInfo {
  content: string
  position: InsertPosition
}

export interface DeleteInfo {
  match: string
  useRegExp: boolean
  caseSensitive: boolean
  matchAll: boolean
}

export interface FormatInfo {
  formatType: FormatType
}

export interface TemplateInfo {
  template: string
}

export interface Rule {
  id: string
  type: RuleType
  enabled: boolean
  info: ReplaceInfo | InsertInfo | DeleteInfo | FormatInfo | TemplateInfo
}

export interface FileInfo {
  name: string
  ext: string
  fullName: string
  dir: string
  fullPath: string
}

export interface RenameOperation {
  oldPath: string
  newPath: string
}
