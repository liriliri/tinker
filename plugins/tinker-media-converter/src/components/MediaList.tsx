import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Film,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import { mediaDurationFormat } from 'share/lib/util'
import type { MediaItem } from '../types'
import store from '../store'
import type { MenuItemConstructorOptions } from 'electron'

interface MediaRowProps {
  item: MediaItem
}

const MediaRow = observer(({ item }: MediaRowProps) => {
  const { t } = useTranslation()

  const handleContextMenu = (e: React.MouseEvent) => {
    if (item.isConverting) return

    const menuItems: MenuItemConstructorOptions[] = []

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

  const { videoInfo, audioInfo, imageInfo } = item
  const thumbnail = videoInfo?.thumbnail || imageInfo?.thumbnail

  return (
    <div
      className={`relative flex items-center gap-3 px-3 py-2 rounded border overflow-hidden ${tw.bg.secondary} ${tw.border} select-none`}
      onContextMenu={handleContextMenu}
    >
      {item.isConverting && (
        <div
          className="absolute inset-0 bg-green-500/10 dark:bg-green-500/15 transition-[width] duration-300"
          style={{ width: `${item.progress}%` }}
        />
      )}
      <div className="flex-shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            className="w-12 h-8 object-cover"
            draggable={false}
          />
        ) : (
          <div
            className={`w-12 h-8 flex items-center justify-center rounded ${tw.bg.tertiary} ${tw.text.secondary}`}
          >
            {item.mediaType === 'video' ? (
              <Film size={16} />
            ) : item.mediaType === 'audio' ? (
              <Music size={16} />
            ) : (
              <ImageIcon size={16} />
            )}
          </div>
        )}
      </div>

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
                {t('duration')}: {mediaDurationFormat(videoInfo.duration)}
              </span>
              {videoInfo.bitrate && (
                <span>
                  {t('bitrate')}: {Math.round(videoInfo.bitrate)}kbps
                </span>
              )}
            </>
          )}
          {audioInfo && (
            <>
              <span>
                {t('duration')}: {mediaDurationFormat(audioInfo.duration)}
              </span>
              {audioInfo.bitrate && (
                <span>
                  {t('bitrate')}: {Math.round(audioInfo.bitrate)}kbps
                </span>
              )}
              {audioInfo.sampleRate && (
                <span>
                  {t('sampleRate')}: {(audioInfo.sampleRate / 1000).toFixed(1)}
                  kHz
                </span>
              )}
            </>
          )}
          {imageInfo && (
            <span>
              {t('resolution')}: {imageInfo.width}×{imageInfo.height}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-shrink-0 flex items-center gap-2">
        {!item.isDone &&
          !item.isConverting &&
          !item.error &&
          !store.isConvertible(item) && (
            <span className={`text-xs ${tw.text.secondary}`}>
              {t('sameFormat')}
            </span>
          )}

        {item.isConverting && (
          <Loader2 size={14} className={`${tw.primary.text} animate-spin`} />
        )}

        {item.isDone && (
          <div className="flex items-center gap-2">
            <div className={`text-xs font-medium ${tw.text.primary}`}>
              {fileSize(item.outputSize)}
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
