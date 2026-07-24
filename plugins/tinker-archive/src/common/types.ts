export interface IArchiveEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtimeMs: number
}

export type SortMethod = 'name' | 'size' | 'mtime'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'list' | 'grid'
