import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { MenuItemConstructorOptions } from 'electron'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
} from 'lucide-react'
import { tw, THEME_COLORS } from '../../theme'
import { FILE_TREE_NS } from './i18n'
import InlineInput from './InlineInput'
import type { ITreeNode, FileTreeProps } from './types'

interface TreeNodeItemProps {
  node: ITreeNode
  depth: number
  dataSource: FileTreeProps['dataSource']
  creatingIn: { parentPath: string; type: 'file' | 'directory' } | null
  renamingPath: string | null
  onStartCreate: (parentPath: string, type: 'file' | 'directory') => void
  onStartRename: (path: string) => void
  onCancelAction: () => void
  onRefreshParent: (parentPath: string) => void
  onOpenFile?: (path: string, name: string) => void
  renderIcon?: FileTreeProps['renderIcon']
  onExpandChange?: (path: string, expanded: boolean) => void
  getContextMenu?: (node: ITreeNode) => MenuItemConstructorOptions[]
  refreshDirs?: Set<string>
  refreshVersion?: number
}

const iconSize = 14

function buildContextMenu(
  node: ITreeNode,
  dataSource: FileTreeProps['dataSource'],
  t: (key: string) => string,
  expanded: boolean,
  callbacks: {
    onExpand: () => void
    onStartCreate: (parentPath: string, type: 'file' | 'directory') => void
    onStartRename: (path: string) => void
    onDelete: () => void
  },
  customItems: MenuItemConstructorOptions[] | undefined
): MenuItemConstructorOptions[] {
  const items: MenuItemConstructorOptions[] = []

  // Built-in: New File / New Folder (directories only, if dataSource supports createNode)
  if (node.isDirectory && dataSource.createNode) {
    items.push(
      {
        label: t('newFile'),
        click: () => {
          if (!expanded) callbacks.onExpand()
          callbacks.onStartCreate(node.path, 'file')
        },
      },
      {
        label: t('newFolder'),
        click: () => {
          if (!expanded) callbacks.onExpand()
          callbacks.onStartCreate(node.path, 'directory')
        },
      },
      { type: 'separator' }
    )
  }

  // Custom items from the consumer
  if (customItems && customItems.length > 0) {
    items.push(...customItems)
  }

  // Built-in: Rename / Delete (if dataSource supports them)
  const hasOperations = dataSource.renameNode || dataSource.deleteNode
  if (hasOperations) {
    if (items.length > 0) {
      items.push({ type: 'separator' })
    }
    if (dataSource.renameNode) {
      items.push({
        label: t('rename'),
        click: () => callbacks.onStartRename(node.path),
      })
    }
    if (dataSource.deleteNode) {
      items.push({
        label: t('delete'),
        click: () => callbacks.onDelete(),
      })
    }
  }

  return items
}

function TreeNodeItem({
  node,
  depth,
  dataSource,
  creatingIn,
  renamingPath,
  onStartCreate,
  onStartRename,
  onCancelAction,
  onRefreshParent,
  onOpenFile,
  renderIcon,
  onExpandChange,
  getContextMenu,
  refreshDirs,
  refreshVersion,
}: TreeNodeItemProps) {
  const { t } = useTranslation(FILE_TREE_NS)
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<ITreeNode[]>([])
  const [loaded, setLoaded] = useState(false)

  const loadChildren = useCallback(async () => {
    try {
      const entries = await dataSource.readDir(node.path)
      setChildren(entries)
      setLoaded(true)
    } catch {
      setChildren([])
      setLoaded(true)
    }
  }, [dataSource, node.path])

  const handleToggle = useCallback(async () => {
    if (!node.isDirectory) {
      onOpenFile?.(node.path, node.name)
      return
    }

    const willExpand = !expanded
    if (willExpand && !loaded) {
      await loadChildren()
    }
    setExpanded(willExpand)
    onExpandChange?.(node.path, willExpand)
  }, [node, expanded, loaded, loadChildren, onOpenFile, onExpandChange])

  // Re-fetch children when refreshVersion changes and this dir is dirty
  useEffect(() => {
    if (!expanded || !loaded || refreshVersion === undefined || !refreshDirs)
      return
    if (refreshDirs.has(node.path)) {
      void loadChildren()
    }
  }, [refreshVersion])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const customItems = getContextMenu?.(node)

    // Only show context menu if there are items
    const hasCustomItems = customItems && customItems.length > 0
    const hasBuiltinOps =
      (node.isDirectory && dataSource.createNode) ||
      dataSource.renameNode ||
      dataSource.deleteNode
    if (!hasCustomItems && !hasBuiltinOps) {
      return
    }

    const items = buildContextMenu(
      node,
      dataSource,
      t,
      expanded,
      {
        onExpand: () => {
          void (async () => {
            if (!loaded) await loadChildren()
            setExpanded(true)
            onExpandChange?.(node.path, true)
          })()
        },
        onStartCreate,
        onStartRename,
        onDelete: async () => {
          await dataSource.deleteNode?.(node.path)
          const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
          onRefreshParent(parentPath)
        },
      },
      customItems || []
    )

    if (items.length > 0) {
      tinker.showContextMenu(e.clientX, e.clientY, items)
    }
  }

  const handleRenameSubmit = async (newName: string) => {
    const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
    const newPath = parentPath + '/' + newName
    await dataSource.renameNode?.(node.path, newPath)
    onCancelAction()
    onRefreshParent(parentPath)
  }

  const handleCreateSubmit = async (name: string) => {
    if (!creatingIn) return
    await dataSource.createNode?.(creatingIn.parentPath, name, creatingIn.type)
    onCancelAction()
    await loadChildren()
  }

  const isRenaming = renamingPath === node.path
  const isCreatingHere =
    creatingIn && creatingIn.parentPath === node.path && expanded

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
            {renderIcon ? (
              renderIcon(node, false)
            ) : (
              <FileText
                size={iconSize}
                className={`${tw.text.tertiary} flex-shrink-0 ml-0.5`}
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
              dataSource={dataSource}
              creatingIn={creatingIn}
              renamingPath={renamingPath}
              onStartCreate={onStartCreate}
              onStartRename={onStartRename}
              onCancelAction={onCancelAction}
              onRefreshParent={onRefreshParent}
              onOpenFile={onOpenFile}
              renderIcon={renderIcon}
              onExpandChange={onExpandChange}
              getContextMenu={getContextMenu}
              refreshDirs={refreshDirs}
              refreshVersion={refreshVersion}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileTree({
  nodes,
  dataSource,
  onOpenFile,
  renderIcon,
  getContextMenu,
  onExpandChange,
  refreshDirs,
  refreshVersion,
  onRefreshChildren,
}: FileTreeProps) {
  const [creatingIn, setCreatingIn] = useState<{
    parentPath: string
    type: 'file' | 'directory'
  } | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)

  const handleCancelAction = () => {
    setCreatingIn(null)
    setRenamingPath(null)
  }

  const handleRefreshParent = (parentPath: string) => {
    onRefreshChildren?.(parentPath)
  }

  return (
    <div className="py-1">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          dataSource={dataSource}
          creatingIn={creatingIn}
          renamingPath={renamingPath}
          onStartCreate={(parentPath, type) =>
            setCreatingIn({ parentPath, type })
          }
          onStartRename={(path) => setRenamingPath(path)}
          onCancelAction={handleCancelAction}
          onRefreshParent={handleRefreshParent}
          onOpenFile={onOpenFile}
          renderIcon={renderIcon}
          onExpandChange={onExpandChange}
          getContextMenu={getContextMenu}
          refreshDirs={refreshDirs}
          refreshVersion={refreshVersion}
        />
      ))}
    </div>
  )
}
