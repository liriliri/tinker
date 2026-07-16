export type ShredMethod = 'quick' | 'dod' | 'thorough'

type FileStatus = 'pending' | 'shredding' | 'error'

export interface FileEntry {
  path: string
  name: string
  size: number
  status: FileStatus
  progress: number
  error?: string
}

export interface ShredProgressEvent {
  path: string
  fileProgress: number
  overallProgress: number
}

export interface ShredResult {
  shredded: number
  errors: { path: string; message: string }[]
}

export const SHRED_METHODS: ShredMethod[] = ['quick', 'dod', 'thorough']

export const SHRED_METHOD_LABEL_KEYS: Record<ShredMethod, string> = {
  quick: 'methodQuick',
  dod: 'methodDod',
  thorough: 'methodThorough',
}
