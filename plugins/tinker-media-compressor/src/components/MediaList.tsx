import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Film, Music, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import type { MediaItem } from '../types'
import store from '../store'

function getReduction(item: MediaItem): string {
  if (!item.originalSize || !item.outputSize) return ''
  const ratio = ((1 - item.outputSize / item.originalSize) * 100).toFixed(1)
  return `${Number(ratio) > 0 ? '-' : '+'}${Math.abs(Number(ratio))}%`
}

function isSmaller(item: MediaItem): boolean {
  return item.originalSize > 0 && item.outputSize < item.originalSize
}

const MediaRow = observer(({ item }: { item: MediaItem }) => {
  const { t } = useTranslation()

  const handleContextMenu = (e: React.MouseEvent) => {
    const menuItems = []

    if (item.isDone && item.outputPath) {
      menuItems.push({
        label: t('showInFileManager'),
        click: () => tinker.showItemInPath(item.outputPath!),
      })
      menuItems.push({ type: 'separator' as const })
    }

    menuItems.push({
      label: t('remove'),
      click: () => store.removeItem(item.id),
    })

    tinker.showContextMenu(e.clientX, e.clientY, menuItems)
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded border ${tw.bg.secondary} ${tw.border} select-none`}
      onContextMenu={handleContextMenu}
    >
      {/* Media type icon */}
      <div className={`flex-shrink-0 ${tw.text.secondary}`}>
        {item.mediaType === 'video' ? <Film size={16} /> : <Music size={16} />}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${tw.text.primary}`}>
          {item.fileName}
        </div>
        <div className={`text-xs ${tw.text.secondary} mt-0.5`}>
          {item.originalSize > 0 ? fileSize(item.originalSize) : '--'}
        </div>
      </div>

      {/* Status area */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {item.isCompressing && (
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-24">
              <div className={`h-1.5 rounded-full ${tw.bg.tertiary}`}>
                <div
                  className={`h-full rounded-full ${tw.primary.bg} transition-all duration-300`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <div
                className={`text-xs text-center mt-0.5 ${tw.text.secondary}`}
              >
                {item.progress}%
              </div>
            </div>
            <Loader2 size={14} className={`${tw.primary.text} animate-spin`} />
          </div>
        )}

        {item.isDone && (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className={`text-xs font-medium ${tw.text.primary}`}>
                {fileSize(item.outputSize)}
              </div>
              {item.originalSize > 0 && (
                <div
                  className={`text-xs font-medium ${
                    isSmaller(item)
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {getReduction(item)}
                </div>
              )}
            </div>
            <CheckCircle2
              size={14}
              className="text-green-500 dark:text-green-400 flex-shrink-0"
            />
          </div>
        )}

        {item.error && (
          <div className="flex items-center gap-1" title={item.error}>
            <AlertCircle
              size={14}
              className="text-red-500 dark:text-red-400 flex-shrink-0"
            />
            <span className="text-xs text-red-500 dark:text-red-400 max-w-32 truncate">
              {item.error.split('\n')[0]}
            </span>
          </div>
        )}

        {!item.isCompressing && !item.isDone && !item.error && (
          <div className={`text-xs ${tw.text.secondary}`}>—</div>
        )}
      </div>
    </div>
  )
})

export default observer(function MediaList() {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex flex-col gap-1">
        {store.items.map((item) => (
          <MediaRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
})
