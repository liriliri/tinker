import { useState, useRef, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import type { MenuItemConstructorOptions } from 'electron'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw, THEME_COLORS } from 'share/theme'
import { getFileIcon } from 'share/lib/util'
import { CODE_EXTS } from 'share/lib/fileType'
import normalizePath from 'licia/normalizePath'
import store from '../store'
import type { ITreeNode } from '../../common/types'

function isCodeFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return CODE_EXTS.has(ext)
}

interface TreeNodeProps {
  node: ITreeNode
  depth: number
  creatingIn: { parentPath: string; type: 'file' | 'directory' } | null
  renamingPath: string | null
  onStartCreate: (parentPath: string, type: 'file' | 'directory') => void
  onStartRename: (path: string) => void
  onCancelAction: () => void
  onRefreshParent: (parentPath: string) => void
}

function InlineInput({
  defaultValue,
  onSubmit,
  onCancel,
}: {
  defaultValue?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (defaultValue) {
      const dotIndex = defaultValue.lastIndexOf('.')
      if (dotIndex > 0) {
        inputRef.current?.setSelectionRange(0, dotIndex)
      } else {
        inputRef.current?.select()
      }
    }
  }, [defaultValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = inputRef.current?.value.trim()
      if (val) onSubmit(val)
      else onCancel()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className={`ml-1.5 text-xs h-5 px-1 outline-none border rounded ${tw.border} ${tw.bg.secondary} ${tw.text.primary}`}
      style={{ width: 'calc(100% - 40px)' }}
      defaultValue={defaultValue || ''}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
    />
  )
}

const TreeNodeItem = observer(function TreeNodeItem({
  node,
  depth,
  creatingIn,
  renamingPath,
  onStartCreate,
  onStartRename,
  onCancelAction,
  onRefreshParent,
}: TreeNodeProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<ITreeNode[]>([])
  const [loaded, setLoaded] = useState(false)
  const [fileIcon, setFileIcon] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!node.isDirectory && !isCodeFile(node.name)) {
      getFileIcon(node.path).then((icon) => {
        if (icon) setFileIcon(icon)
      })
    }
  }, [node.path, node.isDirectory, node.name])

  const loadChildren = useCallback(async () => {
    try {
      const entries = await codeEditor.readDir(node.path)
      setChildren(
        entries.map((e) => ({
          name: e.name,
          path: e.path,
          isDirectory: e.isDirectory,
        }))
      )
      setLoaded(true)
    } catch {
      setChildren([])
      setLoaded(true)
    }
  }, [node.path])

  const handleToggle = async () => {
    if (!node.isDirectory) {
      store.openFile(node.path, node.name)
      return
    }

    const willExpand = !expanded
    if (willExpand && !loaded) {
      await loadChildren()
    }
    setExpanded(willExpand)
    store.setDirExpanded(node.path, willExpand)
  }

  useEffect(() => {
    const dirPath = normalizePath(node.path)
    if (!expanded || !loaded || !store.treeRefreshDirs.has(dirPath)) return
    void loadChildren().finally(() => store.consumeTreeRefresh(node.path))
  }, [store.treeRefreshVersion, expanded, loaded, node.path, loadChildren])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const items: MenuItemConstructorOptions[] = []

    if (node.isDirectory) {
      items.push(
        {
          label: t('newFile'),
          click: async () => {
            if (!expanded) {
              if (!loaded) await loadChildren()
              setExpanded(true)
              store.setDirExpanded(node.path, true)
            }
            onStartCreate(node.path, 'file')
          },
        },
        {
          label: t('newFolder'),
          click: async () => {
            if (!expanded) {
              if (!loaded) await loadChildren()
              setExpanded(true)
              store.setDirExpanded(node.path, true)
            }
            onStartCreate(node.path, 'directory')
          },
        },
        { type: 'separator' }
      )
    }

    items.push(
      {
        label: t('rename'),
        click: () => onStartRename(node.path),
      },
      {
        label: t('delete'),
        click: async () => {
          await tinker.rm(node.path, { recursive: true })
          const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
          onRefreshParent(parentPath)
        },
      }
    )

    tinker.showContextMenu(e.clientX, e.clientY, items)
  }

  const handleRenameSubmit = async (newName: string) => {
    const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
    const newPath = parentPath + '/' + newName
    await codeEditor.renameItem(node.path, newPath)
    onCancelAction()
    onRefreshParent(parentPath)
  }

  const handleCreateSubmit = async (name: string) => {
    const newPath = creatingIn!.parentPath + '/' + name
    if (creatingIn!.type === 'file') {
      await tinker.writeFile(newPath, '')
    } else {
      await codeEditor.createDir(newPath)
    }
    onCancelAction()
    await loadChildren()
  }

  const isRenaming = renamingPath === node.path
  const isCreatingHere =
    creatingIn && creatingIn.parentPath === node.path && expanded

  const iconSize = 14

  return (
    <div>
      <div
        className={`flex items-center h-6 cursor-pointer select-none ${tw.hover}`}
        style={{ paddingLeft: depth * 12 + 4 }}
        onClick={handleToggle}
        onContextMenu={handleContextMenu}
      >
        {node.isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown
                size={iconSize}
                className={`${tw.text.tertiary} flex-shrink-0`}
              />
            ) : (
              <ChevronRight
                size={iconSize}
                className={`${tw.text.tertiary} flex-shrink-0`}
              />
            )}
            {expanded ? (
              <FolderOpen
                size={iconSize}
                style={{ color: THEME_COLORS.primary }}
                className="flex-shrink-0 ml-0.5"
              />
            ) : (
              <Folder
                size={iconSize}
                style={{ color: THEME_COLORS.primary }}
                className="flex-shrink-0 ml-0.5"
              />
            )}
          </>
        ) : (
          <>
            <span style={{ width: iconSize }} className="flex-shrink-0" />
            {isCodeFile(node.name) ? (
              <FileText
                size={iconSize}
                className={`${tw.text.tertiary} flex-shrink-0 ml-0.5`}
              />
            ) : fileIcon ? (
              <img
                src={fileIcon}
                alt=""
                className="flex-shrink-0 ml-0.5"
                style={{ width: iconSize, height: iconSize }}
              />
            ) : (
              <span
                className="flex-shrink-0 ml-0.5"
                style={{ width: iconSize, height: iconSize }}
              />
            )}
          </>
        )}
        {isRenaming ? (
          <InlineInput
            defaultValue={node.name}
            onSubmit={handleRenameSubmit}
            onCancel={onCancelAction}
          />
        ) : (
          <span className={`ml-1.5 text-xs truncate ${tw.text.primary}`}>
            {node.name}
          </span>
        )}
      </div>
      {expanded && (
        <div>
          {isCreatingHere && (
            <div
              className="flex items-center h-6"
              style={{ paddingLeft: (depth + 1) * 12 + 4 }}
            >
              <span style={{ width: iconSize }} className="flex-shrink-0" />
              {creatingIn!.type === 'file' ? (
                <span
                  className="flex-shrink-0 ml-0.5"
                  style={{ width: iconSize, height: iconSize }}
                />
              ) : (
                <Folder
                  size={iconSize}
                  style={{ color: THEME_COLORS.primary }}
                  className="flex-shrink-0 ml-0.5"
                />
              )}
              <InlineInput
                onSubmit={handleCreateSubmit}
                onCancel={onCancelAction}
              />
            </div>
          )}
          {children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              creatingIn={creatingIn}
              renamingPath={renamingPath}
              onStartCreate={onStartCreate}
              onStartRename={onStartRename}
              onCancelAction={onCancelAction}
              onRefreshParent={onRefreshParent}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default observer(function FileTree() {
  const [creatingIn, setCreatingIn] = useState<{
    parentPath: string
    type: 'file' | 'directory'
  } | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)

  const handleCancelAction = () => {
    setCreatingIn(null)
    setRenamingPath(null)
  }

  const handleRefreshParent = async (parentPath: string) => {
    if (parentPath === store.rootPath) {
      await store.loadDirectory(store.rootPath)
    } else if (store.watchedDirs.has(normalizePath(parentPath))) {
      store.markTreeDirDirty(parentPath)
    }
  }

  return (
    <div className="py-1">
      {store.fileTree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          creatingIn={creatingIn}
          renamingPath={renamingPath}
          onStartCreate={(parentPath, type) =>
            setCreatingIn({ parentPath, type })
          }
          onStartRename={(path) => setRenamingPath(path)}
          onCancelAction={handleCancelAction}
          onRefreshParent={handleRefreshParent}
        />
      ))}
    </div>
  )
})
