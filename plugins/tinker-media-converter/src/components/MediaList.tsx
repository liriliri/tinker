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
import className from 'licia/className'
import { tw, THEME_COLORS } from 'share/theme'
import { mediaDurationFormat } from 'share/lib/util'
import { LoadingCircle } from 'share/components/Loading'
import type { MediaItem } from '../types'
import store from '../store'
import type { MenuItemConstructorOptions } from 'electron'

function getCheckboardStyle(isDark: boolean): React.CSSProperties {
  const checkColors = isDark
    ? THEME_COLORS.checkboard.dark
    : THEME_COLORS.checkboard.light
  return {
    backgroundImage: `
      linear-gradient(45deg, ${checkColors.dark} 25%, transparent 25%),
      linear-gradient(-45deg, ${checkColors.dark} 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, ${checkColors.dark} 75%),
      linear-gradient(-45deg, transparent 75%, ${checkColors.dark} 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: checkColors.light,
  }
}

const IMAGE_CARD_STYLE: React.CSSProperties = { aspectRatio: '1 / 1' }
const GRID_STYLE: React.CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
}

interface MediaItemProps {
  item: MediaItem
}

const ImageCard = observer(({ item }: MediaItemProps) => {
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

  const thumbnail = item.imageInfo?.url

  return (
    <div
      className={className(
        `${tw.bg.tertiary} rounded-lg border ${tw.border} overflow-hidden relative flex flex-col ${tw.primary.hoverBorder} transition-all duration-100 select-none`,
        { [`${tw.primary.border}`]: item.isConverting }
      )}
      style={IMAGE_CARD_STYLE}
      onContextMenu={handleContextMenu}
    >
      <div
        className="flex-1 flex items-center justify-center p-2 relative overflow-hidden"
        style={getCheckboardStyle(store.isDark)}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={item.fileName}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <ImageIcon size={32} className={tw.gray.text400} />
        )}
        {item.isConverting && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <LoadingCircle className="w-8 h-8" />
          </div>
        )}
        {item.isDone && (
          <div className="absolute top-1 right-1">
            <CheckCircle2
              size={14}
              className="text-green-500 dark:text-green-400"
            />
          </div>
        )}
        {item.error && (
          <div className="absolute top-1 right-1" title={item.error}>
            <AlertCircle size={14} className="text-red-500 dark:text-red-400" />
          </div>
        )}
      </div>

      <div className={`p-2 ${tw.bg.secondary} flex-shrink-0`}>
        <p
          className={`text-xs font-medium ${tw.text.primary} truncate mb-1`}
          title={item.fileName}
        >
          {item.fileName}
        </p>
        <div className={`text-[10px] ${tw.gray.text400}`}>
          {item.isDone ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="line-through">
                  {fileSize(item.originalSize)}
                </span>
                <span className="text-gray-400 dark:text-gray-600">→</span>
                <span className={`font-medium ${tw.text.primary}`}>
                  {fileSize(item.outputSize)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-left">
              {item.originalSize > 0 ? fileSize(item.originalSize) : '--'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

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
  const thumbnail = videoInfo?.thumbnail

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
  if (store.mode === 'image') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4" style={GRID_STYLE}>
          {store.items.map((item) => (
            <ImageCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    )
  }

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
