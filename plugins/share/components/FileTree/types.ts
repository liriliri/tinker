import type { MenuItemConstructorOptions } from 'electron'

export interface ITreeNode {
  name: string
  path: string
  isDirectory: boolean
}

export interface IFileTreeDataSource {
  readDir(path: string): Promise<ITreeNode[]>
  createNode?(
    parentPath: string,
    name: string,
    type: 'file' | 'directory'
  ): Promise<void>
  renameNode?(oldPath: string, newPath: string): Promise<void>
  deleteNode?(path: string): Promise<void>
}

export interface FileTreeProps {
  nodes: ITreeNode[]
  dataSource: IFileTreeDataSource
  rootPath?: string
  iconSize?: number
  onOpenFile?: (path: string, name: string) => void
  renderIcon?: (node: ITreeNode, expanded: boolean) => React.ReactNode | null
  getContextMenu?: (node: ITreeNode) => MenuItemConstructorOptions[]
  getRootContextMenu?: () => MenuItemConstructorOptions[]
  onExpandChange?: (path: string, expanded: boolean) => void
  refreshDirs?: Set<string>
  refreshVersion?: number
  onRefreshChildren?: (parentPath: string) => void
  activeFilePath?: string
}
