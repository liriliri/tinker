import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Film, Music, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import type { MediaItem } from '../types'
import store from '../store'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

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

  const { videoInfo } = item

  return (
    <div
      className={`relative flex items-center gap-3 px-3 py-3 rounded border overflow-hidden ${tw.bg.secondary} ${tw.border} select-none`}
      onContextMenu={handleContextMenu}
    >
      {item.isCompressing && (
        <div
          className="absolute inset-0 bg-green-500/10 dark:bg-green-500/15 transition-[width] duration-300"
          style={{ width: `${item.progress}%` }}
        />
      )}
      {/* Thumbnail or media type icon */}
      <div className="flex-shrink-0">
        {videoInfo?.thumbnail ? (
          <img
            src={videoInfo.thumbnail}
            className="w-12 h-8 object-cover rounded"
            draggable={false}
          />
        ) : (
          <div
            className={`w-12 h-8 flex items-center justify-center rounded ${tw.bg.tertiary} ${tw.text.secondary}`}
          >
            {item.mediaType === 'video' ? (
              <Film size={16} />
            ) : (
              <Music size={16} />
            )}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${tw.text.primary}`}>
          {item.fileName}
        </div>
        <div
          className={`text-xs ${tw.text.secondary} mt-0.5 flex items-center gap-2`}
        >
          <span>
            {t('size')}:{' '}
            {item.originalSize > 0 ? fileSize(item.originalSize) : '--'}
          </span>
          {videoInfo && (
            <>
              <span>
                {t('resolution')}: {videoInfo.width}×{videoInfo.height}
              </span>
              <span>
                {t('fps')}: {Math.round(videoInfo.fps)}
              </span>
              <span>
                {t('duration')}: {formatDuration(videoInfo.duration)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status area */}
      <div className="relative flex-shrink-0 flex items-center gap-2">
        {item.isCompressing && (
          <div className="flex items-center gap-1.5">
            <span className={`text-xs ${tw.text.secondary}`}>
              {item.progress}%
            </span>
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
      <div className="flex flex-col gap-2">
        {store.items.map((item) => (
          <MediaRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
})
