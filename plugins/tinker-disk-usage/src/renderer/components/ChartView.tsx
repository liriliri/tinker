import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { createTreemapChart } from '../lib/d3chart'
import { confirm } from 'share/components/Confirm'

export default observer(function ChartView() {
  const { t } = useTranslation()
  const chartRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<ReturnType<typeof createTreemapChart> | null>(null)

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
        onContextMenuNode: (event, node) => {
          tinker.showContextMenu(event.clientX, event.clientY, [
            {
              label: t('showInFileManager'),
              click: () => tinker.showItemInPath(node.id),
            },
            { type: 'separator' },
            {
              label: t('delete'),
              click: async () => {
                const confirmed = await confirm({
                  title: t('deleteConfirmTitle'),
                  message: t('deleteConfirmMessage', { name: node.name }),
                })
                if (confirmed) {
                  try {
                    await diskUsage.remove(node.id)
                    store.deleteItem(node.id)
                  } catch (err) {
                    console.error('Delete failed:', err)
                  }
                }
              },
            },
          ])
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
    </div>
  )
})
