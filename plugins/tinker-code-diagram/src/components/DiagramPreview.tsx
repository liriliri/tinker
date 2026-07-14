import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clamp from 'licia/clamp'
import className from 'licia/className'
import MermaidDiagram, {
  type MermaidDiagramStatus,
} from 'share/components/MermaidDiagram'
import ZoomControls from 'share/components/ZoomControls'
import { tw } from 'share/theme'
import store from '../store'
import { getDiagramBackground } from '../lib/mermaid'
import RenderingBadge from './RenderingBadge'

const MIN_SCALE = 10
const MAX_SCALE = 800
const ZOOM_FACTOR = 1.1

interface PanOffset {
  x: number
  y: number
}

export default observer(function DiagramPreview() {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [scale, setScale] = useState(100)
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const canZoomRef = useRef(false)

  const canZoom = store.hasRenderedDiagram && !store.renderError
  canZoomRef.current = canZoom

  const zoomByFactor = (factor: number) => {
    setScale((prev) => clamp(Math.round(prev * factor), MIN_SCALE, MAX_SCALE))
  }

  const resetView = () => {
    setScale(100)
    setPan({ x: 0, y: 0 })
  }

  const handleStatusChange = (status: MermaidDiagramStatus) => {
    setLoading(status.loading)
    store.setRenderError(status.error)
    store.setHasRenderedDiagram(status.hasDiagram)
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleWheel = (e: WheelEvent) => {
      if (!canZoomRef.current) return
      e.preventDefault()
      zoomByFactor(e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      viewport.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !canZoom) return
    draggingRef.current = true
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const dx = e.clientX - lastPointerRef.current.x
    const dy = e.clientY - lastPointerRef.current.y
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div
      id="diagram-preview"
      className={className(
        'relative h-full w-full overflow-hidden',
        store.renderError && 'opacity-60'
      )}
      style={{ backgroundColor: getDiagramBackground(store.darkMode) }}
    >
      {loading && <RenderingBadge />}

      {store.renderError && (
        <div
          className={`absolute top-3 left-3 right-12 z-10 p-3 rounded text-xs font-mono whitespace-pre-wrap border max-h-40 overflow-auto ${tw.bg.primary} ${tw.border} text-red-500`}
        >
          {store.renderError}
        </div>
      )}

      {!store.hasRenderedDiagram && !store.renderError && !loading && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-sm ${tw.text.tertiary}`}
        >
          {t('emptyPreview')}
        </div>
      )}

      <div
        ref={viewportRef}
        className={className(
          'h-full w-full overflow-hidden',
          canZoom && 'cursor-grab active:cursor-grabbing'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="h-full w-full p-4"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${
              scale / 100
            })`,
            transformOrigin: 'center center',
          }}
        >
          <MermaidDiagram
            source={store.codeInput}
            isDark={store.darkMode}
            debounceMs={300}
            errorDisplay="none"
            hideLoading
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {store.hasRenderedDiagram && (
        <ZoomControls
          scale={scale}
          disabled={!!store.renderError}
          onZoomIn={() => zoomByFactor(ZOOM_FACTOR)}
          onZoomOut={() => zoomByFactor(1 / ZOOM_FACTOR)}
          onZoomFit={resetView}
          onZoomToPercent={(percent) =>
            setScale(clamp(Math.round(percent), MIN_SCALE, MAX_SCALE))
          }
        />
      )}
    </div>
  )
})
