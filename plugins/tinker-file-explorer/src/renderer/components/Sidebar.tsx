import { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Folder, HardDrive, Star } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import Tree from 'share/components/Tree'
import type { MenuItemConstructorOptions } from 'electron'
import store from '../store'
import { buildSidebarTree, SidebarNodeData } from '../lib/util'
import CustomPlaceDialog from './CustomPlaceDialog'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const openInNewTabRef = useRef(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{
    id: string
    label: string
    path: string
  } | null>(null)
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

  const handleDialogConfirm = (label: string, path: string) => {
    if (editTarget) {
      store.editCustomPlace(editTarget.id, label, path)
    } else {
      store.addCustomPlace(label, path)
      store.openPath(path)
    }
  }

  const handleEdit = (node: SidebarNodeData) => {
    if (!node.path) return
    setEditTarget({ id: node.id, label: node.label, path: node.path })
    setDialogOpen(true)
  }

  const handleDelete = async (node: SidebarNodeData) => {
    const result = await confirm({
      title: t('deletePlace'),
      message: t('deletePlaceConfirm'),
    })
    if (result) {
      store.removeCustomPlace(node.id)
    }
  }

  const getMenu = (node: SidebarNodeData): MenuItemConstructorOptions[] => {
    if (node.kind === 'section' && node.id === 'section-custom') {
      return [
        {
          label: t('addCustomPlace'),
          click: () => {
            setEditTarget(null)
            setDialogOpen(true)
          },
        },
      ]
    }
    if (node.kind !== 'place' || node.placeGroup !== 'custom') return []
    return [
      {
        label: t('editPlace'),
        click: () => handleEdit(node),
      },
      {
        label: t('deletePlace'),
        click: () => handleDelete(node),
      },
    ]
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
    <div className={`h-full overflow-hidden flex flex-col ${tw.bg.tertiary}`}>
      <OverlayScrollbars defer className="min-h-0 flex-1">
        <div onMouseDown={handleMouseDown}>
          <Tree<SidebarNodeData>
            data={treeData}
            activeNodeId={activePlaceId}
            onNodeClick={handleNodeClick}
            menu={getMenu}
            renderLabel={(node, isActive) => {
              if (node.kind === 'section') {
                return (
                  <span
                    className={className(
                      'text-xs flex-1 truncate font-medium opacity-60',
                      tw.text.primary
                    )}
                  >
                    {node.label}
                  </span>
                )
              }

              let Icon = Folder
              if (node.placeGroup === 'drives') Icon = HardDrive
              else if (node.placeGroup === 'custom') Icon = Star

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
          />
        </div>
      </OverlayScrollbars>

      <CustomPlaceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDialogConfirm}
        initialLabel={editTarget?.label}
        initialPath={editTarget?.path}
      />
    </div>
  )
})
