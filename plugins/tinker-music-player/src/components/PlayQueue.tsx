import { observer } from 'mobx-react-lite'
import { Music, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { formatTime } from '../lib/util'

const PlayQueue = observer(() => {
  const { t } = useTranslation()

  return (
    <div
      className={`w-72 flex flex-col border-l flex-shrink-0 ${tw.border} ${tw.bg.tertiary}`}
    >
      <div className="flex items-center justify-between px-3 h-10 flex-shrink-0">
        <span className={`text-sm font-medium ${tw.text.primary}`}>
          {t('playQueue')} ({store.tracks.length})
        </span>
        <button
          className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
          onClick={() => store.togglePlayQueue()}
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
  )
})

export default PlayQueue
