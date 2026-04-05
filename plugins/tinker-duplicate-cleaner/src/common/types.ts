export interface FileEntry {
  name: string
  path: string
  size: number
  md5?: string
}

export interface DuplicateGroup {
  size: number
  files: FileEntry[]
}
