import { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Music, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { formatTime } from '../lib/util'

const PlayQueue = observer(() => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (store.showPlayQueue) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [store.showPlayQueue])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => store.togglePlayQueue(), 300)
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
          click: () => store.removeTrack(trackId),
        },
      ])
    },
    [t]
  )

  if (!store.showPlayQueue) return null

  return (
    <>
      <div
        className={`absolute inset-0 bottom-14 z-19 bg-black/30 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div
        className={`absolute right-0 top-0 bottom-14 z-20 w-72 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out border-l ${
          tw.border
        } ${tw.bg.tertiary} ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-3 h-10 flex-shrink-0">
          <span className={`text-sm font-medium ${tw.text.primary}`}>
            {t('playQueue')} ({store.tracks.length})
          </span>
          <button
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
            onClick={handleClose}
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {store.tracks.map((track, index) => (
            <button
              key={track.id}
              className={`w-full flex items-center gap-2 px-3 h-10 text-left ${
                tw.hover
              } ${index === store.currentIndex ? tw.active : ''}`}
              onDoubleClick={() => store.playTrack(index)}
              onContextMenu={(e) => handleContextMenu(e, track.id, track.path)}
            >
              {track.cover ? (
                <img
                  src={track.cover}
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${tw.bg.secondary}`}
                >
                  <Music size={12} className={tw.text.tertiary} />
                </div>
              )}
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
                {track.duration > 0 ? formatTime(track.duration) : ''}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
})

export default PlayQueue
