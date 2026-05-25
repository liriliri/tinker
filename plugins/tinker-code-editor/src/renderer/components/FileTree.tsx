import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import type { ITreeNode } from '../../common/types'

interface TreeNodeProps {
  node: ITreeNode
  depth: number
}

const TreeNodeItem = observer(function TreeNodeItem({
  node,
  depth,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<ITreeNode[]>([])
  const [loaded, setLoaded] = useState(false)

  const handleToggle = async () => {
    if (!node.isDirectory) {
      store.openFile(node.path, node.name)
      return
    }

    if (!loaded) {
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
    }
    setExpanded(!expanded)
  }

  const iconSize = 14

  return (
    <div>
      <div
        className={`flex items-center h-6 cursor-pointer select-none ${tw.hover}`}
        style={{ paddingLeft: depth * 12 + 4 }}
        onClick={handleToggle}
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
                className="text-yellow-500 flex-shrink-0 ml-0.5"
              />
            ) : (
              <Folder
                size={iconSize}
                className="text-yellow-500 flex-shrink-0 ml-0.5"
              />
            )}
          </>
        ) : (
          <>
            <span style={{ width: iconSize }} className="flex-shrink-0" />
            <File
              size={iconSize}
              className={`${tw.text.tertiary} flex-shrink-0 ml-0.5`}
            />
          </>
        )}
        <span className={`ml-1.5 text-xs truncate ${tw.text.primary}`}>
          {node.name}
        </span>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNodeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
})

export default observer(function FileTree() {
  return (
    <div className="py-1">
      {store.fileTree.map((node) => (
        <TreeNodeItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  )
})
