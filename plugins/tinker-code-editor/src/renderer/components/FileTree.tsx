import { useCallback, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import normalizePath from 'licia/normalizePath'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import FileTree from 'share/components/FileTree'
import type { IFileTreeDataSource, ITreeNode } from 'share/components/FileTree'
import { getFileIcon } from 'share/lib/util'
import { CODE_EXTS, getFileExt } from 'share/lib/fileType'
import { tw } from 'share/theme'
import { relativePath } from '../lib/path'
import store from '../store'

const iconSize = 14

function isCodeFile(name: string): boolean {
  return CODE_EXTS.has(getFileExt(name))
}

function FileIcon({ node }: { node: ITreeNode }) {
  const [icon, setIcon] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (node.isDirectory || isCodeFile(node.name)) return
    getFileIcon(node.path).then((i) => {
      if (i) setIcon(i)
    })
  }, [node.path, node.name, node.isDirectory])

  if (isCodeFile(node.name)) {
    return (
      <FileText
        size={iconSize}
        className={`${tw.text.tertiary} flex-shrink-0 ml-0.5`}
      />
    )
  }

  if (icon) {
    return (
      <img
        src={icon}
        alt=""
        className="flex-shrink-0 ml-0.5"
        style={{ width: iconSize, height: iconSize }}
      />
    )
  }

  return (
    <span
      className="flex-shrink-0 ml-0.5"
      style={{ width: iconSize, height: iconSize }}
    />
  )
}

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
      onOpenFile={(path, name) => {
        void store.openFile(path, name)
      }}
      renderIcon={(node) => <FileIcon node={node} />}
      onExpandChange={handleExpandChange}
      refreshDirs={store.treeRefreshDirs}
      refreshVersion={store.treeRefreshVersion}
      getContextMenu={getContextMenu}
      onRefreshChildren={handleRefreshChildren}
    />
  )
})
