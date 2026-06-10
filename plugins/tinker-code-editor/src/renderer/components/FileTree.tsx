import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import normalizePath from 'licia/normalizePath'
import { useTranslation } from 'react-i18next'
import FileTree from 'share/components/FileTree'
import type { IFileTreeDataSource, ITreeNode } from 'share/components/FileTree'
import FileIcon from 'share/components/FileIcon'
import { relativePath } from '../lib/path'
import store from '../store'

const ICON_SIZE = 16

const localFileDataSource: IFileTreeDataSource = {
  readDir: async (path: string) => {
    const entries = await codeEditor.readDir(path)
    return entries.map((e) => ({
      name: e.name,
      path: e.path,
      isDirectory: e.isDirectory,
    }))
  },
  createNode: async (
    parentPath: string,
    name: string,
    type: 'file' | 'directory'
  ) => {
    const newPath = parentPath + '/' + name
    if (type === 'file') {
      await tinker.writeFile(newPath, '')
    } else {
      await codeEditor.createDir(newPath)
    }
  },
  renameNode: async (oldPath: string, newPath: string) => {
    await codeEditor.renameItem(oldPath, newPath)
  },
  deleteNode: async (path: string) => {
    await tinker.rm(path, { recursive: true })
  },
}

export default observer(function CodeEditorFileTree() {
  const { t } = useTranslation()

  const activeFilePath = store.activeTabId
    ? store.tabs.find((tab) => tab.id === store.activeTabId)?.filePath
    : undefined

  const getContextMenu = useCallback(
    (node: ITreeNode) => [
      {
        label: t('showInFolder'),
        click: () => tinker.showItemInPath(node.path),
      },
      {
        label: t('openInIntegratedTerminal'),
        click: () =>
          store.openInIntegratedTerminal(node.path, node.isDirectory),
      },
      { type: 'separator' as const },
      {
        label: t('copyPath'),
        click: () => navigator.clipboard.writeText(node.path),
      },
      {
        label: t('copyRelativePath'),
        click: () =>
          navigator.clipboard.writeText(
            relativePath(store.rootPath, node.path)
          ),
      },
    ],
    [t]
  )

  const handleExpandChange = useCallback((path: string, expanded: boolean) => {
    store.setDirExpanded(path, expanded)
  }, [])

  const handleRefreshChildren = useCallback((parentPath: string) => {
    if (parentPath === store.rootPath) {
      void store.loadDirectory(store.rootPath)
    } else if (store.watchedDirs.has(normalizePath(parentPath))) {
      store.markTreeDirDirty(parentPath)
    }
  }, [])

  return (
    <FileTree
      nodes={store.fileTree}
      dataSource={localFileDataSource}
      iconSize={ICON_SIZE}
      onOpenFile={(path, name) => {
        void store.openFile(path, name)
      }}
      renderIcon={(node) => {
        if (node.isDirectory) return null
        return (
          <FileIcon
            name={node.name}
            path={node.path}
            isDark={store.isDark}
            size={ICON_SIZE}
            className="ml-0.5 flex-shrink-0"
          />
        )
      }}
      onExpandChange={handleExpandChange}
      refreshDirs={store.treeRefreshDirs}
      refreshVersion={store.treeRefreshVersion}
      getContextMenu={getContextMenu}
      onRefreshChildren={handleRefreshChildren}
      activeFilePath={activeFilePath}
    />
  )
})
