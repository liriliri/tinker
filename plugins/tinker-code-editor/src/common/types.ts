export interface ITreeNode {
  name: string
  path: string
  isDirectory: boolean
}

export interface IEditorTab {
  id: string
  title: string
  filePath: string
  content: string
  isDirty: boolean
}
