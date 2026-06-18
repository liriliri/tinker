import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Lock,
  LockOpen,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'

interface FloatLyricProps {
  onClose: () => void
}

export default observer(function FloatLyric({ onClose }: FloatLyricProps) {
  const { t } = useTranslation()
  const [locked, setLocked] = useState(false)
  const [showOps, setShowOps] = useState(false)
  const track = store.currentTrack

  const lyricText =
    store.currentLyricText ||
    (track ? `${track.title} - ${track.artist || ''}` : t('noLyric'))

  return (
    <div
      className={`relative w-full h-full select-none cursor-default ${
        !locked ? 'hover:bg-black/20' : ''
      }`}
      style={
        { WebkitAppRegion: locked ? 'no-drag' : 'drag' } as React.CSSProperties
      }
      onMouseEnter={() => {
        if (!locked) {
          setShowOps(true)
        }
      }}
      onMouseLeave={() => setShowOps(false)}
    >
      {/* Operations bar */}
      <div className="w-full h-[46px] flex items-end justify-center">
        {(showOps || locked) && (
          <div
            className="h-7 flex items-center justify-center gap-4"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {locked ? (
              <button
                className="w-7 h-7 flex items-center justify-center text-white drop-shadow-md cursor-pointer"
                onClick={() => setLocked(false)}
                onMouseEnter={() => setShowOps(true)}
              >
                <LockOpen size={20} />
              </button>
            ) : (
              <>
                <button
                  className="w-7 h-7 flex items-center justify-center text-white drop-shadow-md cursor-pointer"
                  onClick={() => store.playPrev()}
                >
                  <SkipBack size={20} />
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center text-white drop-shadow-md cursor-pointer"
                  onClick={() => store.togglePlay()}
                >
                  {store.isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center text-white drop-shadow-md cursor-pointer"
                  onClick={() => store.playNext()}
                >
                  <SkipForward size={20} />
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center text-white drop-shadow-md cursor-pointer"
                  onClick={() => setLocked(true)}
                >
                  <Lock size={20} />
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center text-white drop-shadow-md cursor-pointer"
                  onClick={onClose}
                >
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lyric content */}
      <div
        className="w-full flex items-center justify-center overflow-hidden px-4"
        style={{ height: 'calc(100% - 60px)' }}
      >
        <div
          className="truncate text-white text-5xl max-w-full text-center"
          style={{
            WebkitTextStroke: '1px #b48f1d',
          }}
        >
          {lyricText}
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-3.5" />
    </div>
  )
})
