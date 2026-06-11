export type FileWatchEventType =
  | 'add'
  | 'addDir'
  | 'change'
  | 'unlink'
  | 'unlinkDir'

export interface IFileWatchEvent {
  type: FileWatchEventType
  path: string
}
