import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Play, Pause, SkipBack, SkipForward, X, Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'

interface MiniModeProps {
  onClose: () => void
}

export default observer(function MiniMode({ onClose }: MiniModeProps) {
  const { t } = useTranslation()
  const [hover, setHover] = useState(false)
  const track = store.currentTrack

  const textContent = (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden text-white text-[13px]">
      <span className="line-clamp-2 text-center">
        {track?.title || t('noTrack')}
      </span>
      {track?.artist && (
        <span className="line-clamp-1 text-center opacity-70 text-xs mt-0.5">
          {track.artist}
        </span>
      )}
    </div>
  )

  const controls = (
    <div className="relative flex items-center justify-center gap-5 h-full pr-12">
      <button
        className="text-white opacity-80 hover:opacity-100"
        onClick={() => store.playPrev()}
      >
        <SkipBack size={28} />
      </button>
      <button
        className="text-white opacity-80 hover:opacity-100"
        onClick={() => store.togglePlay()}
      >
        {store.isPlaying ? (
          <Pause size={28} fill="currentColor" />
        ) : (
          <Play size={28} fill="currentColor" />
        )}
      </button>
      <button
        className="text-white opacity-80 hover:opacity-100"
        onClick={() => store.playNext()}
      >
        <SkipForward size={28} />
      </button>
      <button
        className="absolute right-0 top-0 text-white opacity-80 hover:opacity-100"
        onClick={onClose}
      >
        <X size={16} />
      </button>
    </div>
  )

  return (
    <div className="w-full h-full bg-transparent select-none">
      <div
        className="relative w-full h-[72px] box-border p-2 flex gap-3 items-center rounded-md overflow-hidden"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Background mask */}
        <div className="absolute inset-0 -z-20 bg-[#333]" />
        {/* Blurred album background */}
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-60 blur-[15px] transition-all duration-300"
          style={{
            backgroundImage: track?.cover ? `url(${track.cover})` : undefined,
          }}
        />

        {/* Album cover */}
        {track?.cover ? (
          <img
            src={track.cover}
            draggable={false}
            className="w-14 h-14 rounded-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-md bg-black/30 flex items-center justify-center flex-shrink-0">
            <Music size={24} className="text-white/60" />
          </div>
        )}

        {/* Body: text or controls */}
        <div
          className="flex-1 h-full"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {hover ? controls : textContent}
        </div>
      </div>
    </div>
  )
})
