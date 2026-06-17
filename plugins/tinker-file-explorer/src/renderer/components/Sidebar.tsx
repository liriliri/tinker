import { useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Folder, HardDrive } from 'lucide-react'
import { tw } from 'share/theme'
import Tree from 'share/components/Tree'
import store from '../store'
import { buildSidebarTree, SidebarNodeData } from '../lib/util'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const openInNewTabRef = useRef(false)
  const activePath = store.activeTab?.path ?? ''
  const activePlaceId =
    store.places.find((place) => place.path === activePath)?.id ?? null
  const treeData = buildSidebarTree(store.places, t)

  const handleMouseDown = (e: React.MouseEvent) => {
    openInNewTabRef.current = e.metaKey || e.ctrlKey
  }

  const handleNodeClick = (node: SidebarNodeData) => {
    if (node.kind !== 'place' || !node.path) return
    store.openPath(node.path, openInNewTabRef.current)
  }

  if (store.placesLoading && store.places.length === 0) {
    return (
      <div
        className={`h-full flex items-center justify-center text-sm ${tw.bg.tertiary} ${tw.text.tertiary}`}
      >
        {t('loading')}
      </div>
    )
  }

  return (
    <div
      className={`h-full overflow-hidden ${tw.bg.tertiary}`}
      onMouseDown={handleMouseDown}
    >
      <Tree<SidebarNodeData>
        data={treeData}
        activeNodeId={activePlaceId}
        onNodeClick={handleNodeClick}
        renderLabel={(node, isActive) => {
          if (node.kind === 'section') {
            return (
              <span
                className={className(
                  'text-xs font-medium uppercase tracking-wide',
                  tw.text.tertiary
                )}
              >
                {node.label}
              </span>
            )
          }

          const Icon = node.placeGroup === 'drives' ? HardDrive : Folder

          return (
            <>
              <Icon size={16} className="flex-shrink-0 mr-1 opacity-70" />
              <span
                className={className(
                  'text-sm flex-1 truncate',
                  isActive ? 'font-medium' : tw.text.primary
                )}
                title={node.path}
              >
                {node.label}
              </span>
            </>
          )
        }}
        emptyText={t('noDrives')}
        className="h-full"
      />
    </div>
  )
})
