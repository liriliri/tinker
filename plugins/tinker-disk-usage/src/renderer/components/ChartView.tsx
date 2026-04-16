import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import store from '../store'
import { createTreemapChart } from '../lib/d3chart'

interface DeleteTarget {
  id: string
  name: string
}

export default observer(function ChartView() {
  const { t } = useTranslation()
  const chartRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<ReturnType<typeof createTreemapChart> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)

    const success = await store.deleteItem(id)
    if (!success) {
      console.error('Delete failed:', id)
    }
  }

  useEffect(() => {
    if (!chartRef.current || !store.currentData) return

    const container = chartRef.current

    if (controlsRef.current) {
      controlsRef.current.destroy()
    }

    const controls = createTreemapChart(
      container,
      store.currentData,
      {
        onClickNode: async (node) => {
          if (node.isDirectory) {
            await store.navigateTo(node.id)
          }
        },
        onExpandNode: async (node) => {
          await store.expandNode(node.id)
        },
        onContextMenuNode: (event, node, isRoot) => {
          const menuItems: Parameters<typeof tinker.showContextMenu>[2] = [
            {
              label: t('showInFileManager'),
              click: () => tinker.showItemInPath(node.id),
            },
          ]

          if (!isRoot) {
            menuItems.push(
              { type: 'separator' },
              {
                label: t('delete'),
                click: () => {
                  setDeleteTarget({ id: node.id, name: node.name })
                },
              }
            )
          }

          tinker.showContextMenu(event.clientX, event.clientY, menuItems)
        },
      },
      store.isDark
    )

    controlsRef.current = controls
    store.setChartControls(controls)

    return () => {
      controls.destroy()
      controlsRef.current = null
    }
  }, [store.currentData, store.isDark, store.navigatePath])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={chartRef} className="treemap flex-1" />
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('deleteConfirmTitle')}
      >
        <p className={`text-sm ${tw.text.secondary} mb-4`}>
          {t('deleteConfirmMessage', { name: deleteTarget?.name })}
        </p>
        <Checkbox
          checked={store.moveToTrash}
          onChange={(checked) => store.setMoveToTrash(checked)}
          className="mb-6"
        >
          {t('moveToTrash')}
        </Checkbox>
        <div className="flex gap-2 justify-end">
          <DialogButton variant="text" onClick={() => setDeleteTarget(null)}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleConfirmDelete}>
            {t('confirm')}
          </DialogButton>
        </div>
      </Dialog>
    </div>
  )
})
