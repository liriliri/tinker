import { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { mediaDurationFormat } from 'share/lib/util'
import TrackCover from './TrackCover'

const PlayQueue = observer(() => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (store.showPlayQueue) {
      setMounted(true)
    } else {
      setVisible(false)
    }
  }, [store.showPlayQueue])

  useEffect(() => {
    if (mounted && store.showPlayQueue) {
      requestAnimationFrame(() => setVisible(true))
    }
  }, [mounted])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => store.togglePlayQueue(), 300)
  }

  const handleTransitionEnd = () => {
    if (!visible) {
      setMounted(false)
    }
  }

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, trackId: string, trackPath: string) => {
      e.preventDefault()
      e.stopPropagation()
      tinker.showContextMenu(e.clientX, e.clientY, [
        {
          label: t('addToSheet'),
          click: () => store.showAddToSheet(trackId),
        },
        { type: 'separator' as const },
        {
          label: t('showInFolder'),
          click: () => tinker.showItemInPath(trackPath),
        },
        {
          label: t('remove'),
          click: () => store.removeFromQueue(trackId),
        },
      ])
    },
    [t]
  )

  if (!mounted) return null

  return (
    <>
      <div
        className={`fixed inset-0 bottom-14 z-51 bg-black/30 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div
        onTransitionEnd={handleTransitionEnd}
        className={`fixed right-0 top-0 bottom-14 z-52 w-72 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out border-l ${
          tw.border
        } ${tw.bg.tertiary} ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-3 h-10 flex-shrink-0">
          <span className={`text-sm font-medium ${tw.text.primary}`}>
            {t('playQueue')} ({store.playQueue.length})
          </span>
          <button
            className={`px-2 py-0.5 rounded text-xs ${tw.hover} ${tw.text.secondary}`}
            onClick={() => store.clearPlayQueue()}
          >
            {t('clearAll')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {store.playQueue.map((track, index) => (
            <button
              key={track.id}
              className={`w-full flex items-center gap-2 px-3 h-10 text-left ${
                tw.hover
              } ${index === store.currentIndex ? tw.active : ''}`}
              onDoubleClick={() => store.playQueueAt(index)}
              onContextMenu={(e) => handleContextMenu(e, track.id, track.path)}
            >
              <TrackCover
                cover={track.cover}
                className="w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  store.playQueueAt(index)
                }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs truncate ${
                    index === store.currentIndex
                      ? tw.primary.text
                      : tw.text.primary
                  }`}
                >
                  {track.title}
                </div>
                {track.artist && (
                  <div className={`text-[11px] ${tw.text.tertiary} truncate`}>
                    {track.artist}
                  </div>
                )}
              </div>
              <span className={`text-[11px] ${tw.text.tertiary} flex-shrink-0`}>
                {track.duration > 0 ? mediaDurationFormat(track.duration) : ''}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
})

export default PlayQueue
