import { useCallback, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { openPopupWindow } from 'share/lib/popupWindow'
import { tw } from 'share/theme'
import store from '../store'
import { getCheckboardStyle } from '../lib/checkboard'

interface CompareWindowProps {
  popup: Window
  onClose: () => void
}

const CompareWindow = observer(function CompareWindow({
  popup,
  onClose,
}: CompareWindowProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const draggingRef = useRef(false)

  const image = store.compareImageId
    ? store.images.find((img) => img.id === store.compareImageId)
    : null

  useEffect(() => {
    if (!image || !image.compressedUrl) {
      onClose()
      return
    }
    popup.document.title = `${t('compareImages')} - ${image.fileName}`
  }, [image, onClose, popup, t])

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const next = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, next)))
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    updatePosition(e.clientX)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  if (!image || !image.compressedUrl) {
    return null
  }

  return (
    <div
      className={`h-screen flex items-center justify-center overflow-hidden p-3 ${tw.bg.primary}`}
    >
      <div
        ref={containerRef}
        className="relative max-w-full max-h-full select-none cursor-col-resize touch-none"
        style={{
          width: 'fit-content',
          ...getCheckboardStyle(store.isDark),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={image.compressedUrl}
          alt={t('compressed')}
          className="block max-w-full max-h-[calc(100vh-1.5rem)] h-auto"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={image.originalImage.src}
            alt={t('original')}
            className="absolute inset-0 w-full h-full object-fill"
            draggable={false}
          />
        </div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white bg-black/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-8 -3 16 6"
              className="w-5 h-3 stroke-white"
            >
              <path
                d="M -5 -2 L -7 0 L -5 2 M 5 -2 L 7 0 L 5 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
        <div className="absolute top-2 left-2 px-1.5 py-0.5 text-xs text-white bg-black/50 rounded pointer-events-none">
          {t('original')}
        </div>
        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-xs text-white bg-black/50 rounded pointer-events-none">
          {t('compressed')}
        </div>
      </div>
    </div>
  )
})

let popupWindow: Window | null = null

export function openCompareWindow(imageId: string) {
  const image = store.images.find((img) => img.id === imageId)
  if (!image || !image.compressedUrl) return

  store.setCompareImageId(imageId)

  if (popupWindow && !popupWindow.closed) {
    popupWindow.focus()
    return
  }

  const naturalWidth = image.originalImage.naturalWidth || 800
  const naturalHeight = image.originalImage.naturalHeight || 600
  const chromeHeight = 28
  const padding = 24
  const width = Math.min(
    Math.max(naturalWidth + padding, 400),
    Math.floor(window.screen.availWidth * 0.9)
  )
  const height = Math.min(
    Math.max(naturalHeight + chromeHeight + padding, 300),
    Math.floor(window.screen.availHeight * 0.9)
  )

  popupWindow = openPopupWindow(
    {
      width,
      height,
      minWidth: 400,
      minHeight: 300,
      frame: true,
      alwaysOnTop: false,
      skipTaskbar: false,
      positionKey: 'image-compressor-compare',
    },
    (popup, onClose) => <CompareWindow popup={popup} onClose={onClose} />
  )

  popupWindow?.addEventListener('beforeunload', () => {
    store.setCompareImageId(null)
    popupWindow = null
  })
}
