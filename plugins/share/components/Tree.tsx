import { useState, ReactNode } from 'react'
import { tw } from '../theme'
import className from 'licia/className'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { MenuItemConstructorOptions } from 'electron'

export interface TreeNodeData {
  id: string
  label: string
  children?: TreeNodeData[]
  [key: string]: unknown
}

interface TreeNodeProps<T extends TreeNodeData = TreeNodeData> {
  node: T
  level: number
  onNodeClick?: (node: T) => void
  activeNodeId?: string | null
  renderLabel?: (node: T, isActive: boolean) => ReactNode
  menu?: (node: T) => MenuItemConstructorOptions[]
}

function TreeNode<T extends TreeNodeData = TreeNodeData>({
  node,
  level,
  onNodeClick,
  activeNodeId,
  renderLabel,
  menu,
}: TreeNodeProps<T>) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onNodeClick?.(node)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!menu) return
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, menu(node))
  }

  const isActive = activeNodeId === node.id

  return (
    <div className="tree-node">
      <div
        className={`
          flex items-center py-1 px-2 cursor-pointer
          transition-colors
          ${isActive ? tw.primary.bg : tw.hover}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 mr-1 p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        {!hasChildren && <span className="w-5 flex-shrink-0" />}
        {renderLabel ? (
          renderLabel(node, isActive)
        ) : (
          <span
            className={className(
              'text-sm truncate',
              isActive ? 'text-white font-medium' : tw.text.primary
            )}
            title={node.label}
          >
            {node.label}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child as T}
              level={level + 1}
              onNodeClick={onNodeClick}
              activeNodeId={activeNodeId}
              renderLabel={renderLabel}
              menu={menu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TreeProps<T extends TreeNodeData = TreeNodeData> {
  data: T | T[] | null
  onNodeClick?: (node: T) => void
  activeNodeId?: string | null
  renderLabel?: (node: T, isActive: boolean) => ReactNode
  menu?: (node: T) => MenuItemConstructorOptions[]
  emptyText?: string
  className?: string
}

export default function Tree<T extends TreeNodeData = TreeNodeData>({
  data,
  onNodeClick,
  activeNodeId,
  renderLabel,
  menu,
  emptyText = 'No data available',
  className: customClassName,
}: TreeProps<T>) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div
        className={className(
          'flex-1 flex items-center justify-center p-4',
          tw.text.secondary,
          customClassName
        )}
      >
        <p className="text-sm text-center">{emptyText}</p>
      </div>
    )
  }

  const nodes = Array.isArray(data) ? data : [data]

  return (
    <div
      className={className(
        'flex-1 overflow-y-auto overflow-x-hidden',
        customClassName
      )}
      style={{
        scrollbarWidth: 'thin',
      }}
    >
      {nodes.map((node, index) => (
        <TreeNode
          key={node.id || index}
          node={node}
          level={0}
          onNodeClick={onNodeClick}
          activeNodeId={activeNodeId}
          renderLabel={renderLabel}
          menu={menu}
        />
      ))}
    </div>
  )
}
