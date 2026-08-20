import { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Play, Pause, SkipBack, SkipForward, X, Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'

interface MiniModeProps {
  popup: Window
  onClose: () => void
}

const DRAG_THRESHOLD = 4
const BTN_CLASS = 'text-white opacity-80 hover:opacity-100'

export default observer(function MiniMode({ popup, onClose }: MiniModeProps) {
  const { t } = useTranslation()
  const [hover, setHover] = useState(false)
  const track = store.currentTrack
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    winX: 0,
    winY: 0,
  })

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    // Do not capture yet — immediate capture steals click from buttons.
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.screenX,
      startY: e.screenY,
      winX: popup.screenX,
      winY: popup.screenY,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.screenX - d.startX
    const dy = e.screenY - d.startY
    if (
      !d.moved &&
      (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
    ) {
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (d.moved) {
      // Runs in opener realm but must move the popup BrowserWindow.
      popup.moveTo(d.winX + dx, d.winY + dy)
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (d.active && d.moved && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    d.active = false
  }

  const clickUnlessDragged = (action: () => void) => () => {
    if (!dragRef.current.moved) action()
  }

  return (
    <div
      className="relative w-full h-[72px] box-border p-2 flex gap-3 items-center rounded-md overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="absolute inset-0 -z-20 bg-neutral-800" />
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-60 blur-[15px] transition-all duration-300"
        style={{
          backgroundImage: track?.cover ? `url(${track.cover})` : undefined,
        }}
      />

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

      <div className="flex-1 h-full">
        {hover ? (
          <div className="relative flex items-center justify-center gap-5 h-full pr-12">
            <button
              className={BTN_CLASS}
              onClick={clickUnlessDragged(() => store.playPrev())}
            >
              <SkipBack size={28} />
            </button>
            <button
              className={BTN_CLASS}
              onClick={clickUnlessDragged(() => store.togglePlay())}
            >
              {store.isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" />
              )}
            </button>
            <button
              className={BTN_CLASS}
              onClick={clickUnlessDragged(() => store.playNext())}
            >
              <SkipForward size={28} />
            </button>
            <button
              className={`absolute right-0 top-0 ${BTN_CLASS}`}
              onClick={clickUnlessDragged(onClose)}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
})
