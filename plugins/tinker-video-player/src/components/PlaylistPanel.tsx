import { useCallback, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Play, X, Film } from 'lucide-react'
import { mediaDurationFormat } from 'share/lib/util'
import { confirm } from 'share/components/Confirm'
import store from '../store'

export default observer(function PlaylistPanel() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (store.showPlaylist) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [store.showPlaylist])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => store.closePlaylist(), 300)
  }

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, filePath: string) => {
      e.preventDefault()
      e.stopPropagation()
      tinker.showContextMenu(e.clientX, e.clientY, [
        {
          label: t('play'),
          click: () => {
            store.setVideo(filePath)
            handleClose()
          },
        },
        {
          label: t('remove'),
          click: () => store.removeFromHistory(filePath),
        },
        { type: 'separator' },
        {
          label: t('clearAll'),
          click: async () => {
            const confirmed = await confirm({ title: t('confirmClear') })
            if (confirmed) {
              store.clearHistory()
            }
          },
        },
      ])
    },
    [t]
  )

  if (!store.showPlaylist) return null

  return (
    <>
      <div
        className={`absolute inset-0 z-19 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 z-20 w-72 bg-black/70 backdrop-blur-sm flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="flex-1 overflow-y-auto">
          {store.playHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40 text-sm">
              {t('noHistory')}
            </div>
          ) : (
            store.playHistory.map((item) => {
              const isActive = item.filePath === store.filePath

              return (
                <div
                  key={item.filePath}
                  className={`group flex items-center gap-2.5 px-2.5 py-2 mx-2.5 my-2 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    store.setVideo(item.filePath)
                    handleClose()
                  }}
                  onContextMenu={(e) => handleContextMenu(e, item.filePath)}
                >
                  <div className="relative shrink-0 w-16 h-10 rounded overflow-hidden bg-white/5">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <Film size={16} className="text-white/30" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play size={12} className="text-white" />
                      </div>
                    )}
                    {item.duration != null && (
                      <span className="absolute bottom-0.5 right-0.5 text-[10px] leading-none bg-black/70 text-white/90 px-1 py-0.5 rounded">
                        {mediaDurationFormat(item.duration)}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 text-sm truncate min-w-0">
                    {item.name}
                  </span>
                  <button
                    className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      store.removeFromHistory(item.filePath)
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
})
