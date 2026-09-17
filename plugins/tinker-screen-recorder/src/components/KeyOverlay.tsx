import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import isMac from 'licia/isMac'
import { formatKeyStroke } from '../lib/formatKey'

interface KeyOverlayProps {
  popup: Window
  onClose: () => void
}

interface KeyEntry {
  keycode: number
  label: string
}

const DRAG_THRESHOLD = 4

function isOverPopup(popup: Window, x: number, y: number) {
  const left = popup.screenX
  const top = popup.screenY
  const right = left + popup.outerWidth
  const bottom = top + popup.outerHeight
  return x >= left && x < right && y >= top && y < bottom
}

export default function KeyOverlay({ popup, onClose }: KeyOverlayProps) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<KeyEntry[]>([])
  const [hasTyped, setHasTyped] = useState(false)
  const [hovered, setHovered] = useState(false)
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    winX: 0,
    winY: 0,
  })

  const showChrome = !hasTyped || hovered

  useEffect(() => {
    if (!popup.setIgnoreMouseEvents) return
    void popup.setIgnoreMouseEvents(!showChrome)
  }, [popup, showChrome])

  useEffect(() => {
    let cancelled = false
    const offs: Array<() => void> = []

    function track(offPromise: Promise<() => void>) {
      void offPromise.then((off) => {
        if (cancelled) off()
        else offs.push(off)
      })
    }

    async function bind() {
      try {
        track(
          tinker.registerMouse('move', (event) => {
            if (cancelled || popup.closed) return
            setHovered(isOverPopup(popup, event.x, event.y))
          })
        )
        track(
          tinker.registerKeyboard('down', (event) => {
            if (cancelled || popup.closed || event.repeat) return
            const label = formatKeyStroke(event)
            if (!label) return
            setHasTyped(true)
            setEntries((prev) => {
              if (prev.some((e) => e.keycode === event.keycode)) return prev
              return [...prev, { keycode: event.keycode, label }]
            })
          })
        )
        track(
          tinker.registerKeyboard('up', (event) => {
            if (cancelled || popup.closed) return
            setEntries((prev) =>
              prev.filter((e) => e.keycode !== event.keycode)
            )
          })
        )
      } catch (err) {
        console.error(err)
        tinker.showNotification(
          t(isMac ? 'keyOverlayPermissionRequired' : 'keyOverlayFailed')
        )
        onClose()
      }
    }

    void bind()

    return () => {
      cancelled = true
      for (const off of offs) off()
    }
  }, [popup, onClose, t])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
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

  return (
    <div
      className="relative h-full w-full select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={`absolute inset-0 rounded-2xl bg-black/60 transition-opacity duration-300 ease-out ${
          showChrome ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="relative z-10 h-full w-full flex items-center justify-center px-4 py-3">
        <div
          className={`absolute text-white/70 text-xl pointer-events-none transition-opacity duration-300 ease-out ${
            showChrome && entries.length === 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {t('keyOverlayHint')}
        </div>
        <div className="flex items-center justify-center gap-4 w-full min-h-0 overflow-hidden">
          {entries.map((entry) => (
            <div
              key={entry.keycode}
              className="shrink-0 px-3 py-1 rounded-lg bg-black/70 text-white text-4xl font-semibold tracking-wide transition-opacity duration-150 ease-out"
            >
              {entry.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
