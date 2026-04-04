import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Play, X } from 'lucide-react'
import store from '../store'

export default observer(function PlaylistPanel() {
  const { t } = useTranslation()

  if (!store.showPlaylist) return null

  return (
    <>
      <div
        className="absolute inset-0 z-19"
        onClick={() => store.togglePlaylist()}
      />
      <div className="absolute right-0 top-0 bottom-0 z-20 w-64 bg-black/70 backdrop-blur-sm flex flex-col overflow-hidden">
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
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => store.setVideo(item.filePath)}
                >
                  <Play
                    size={14}
                    className={`shrink-0 ${
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-50'
                    }`}
                  />
                  <span className="flex-1 text-sm truncate">{item.name}</span>
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
