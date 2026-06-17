export interface IFileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtimeMs: number
}

export type SortMethod = 'name' | 'size' | 'mtime'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'list' | 'grid'

export interface IDriveInfo {
  label: string
  path: string
}

export interface IFavoritePlace {
  id: string
  label: string
  path: string
  group: 'shortcuts' | 'drives' | 'custom'
}

export type ClipboardMode = 'copy' | 'cut'

export interface IClipboardItem {
  path: string
  name: string
  isDirectory: boolean
}
