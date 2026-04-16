export interface FileEntry {
  name: string
  path: string
  size: number
}

export type FilterTab =
  | 'all'
  | 'audio'
  | 'video'
  | 'document'
  | 'image'
  | 'other'
