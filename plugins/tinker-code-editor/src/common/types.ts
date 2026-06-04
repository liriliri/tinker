export interface IEditorTab {
  id: string
  title: string
  filePath: string
  content: string
  isDirty: boolean
}

export type SplitDirection = 'horizontal' | 'vertical'

export interface ISplitNode {
  type: 'split'
  direction: SplitDirection
  first: ILayoutNode
  second: ILayoutNode
  firstSize?: string
  key?: string
}

export interface ILeafNode {
  type: 'leaf'
  paneId: string
}

export type ILayoutNode = ISplitNode | ILeafNode

export interface ITerminalTab {
  id: string
  title: string
  layout: ILayoutNode
}

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
