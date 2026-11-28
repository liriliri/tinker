import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import clamp from 'licia/clamp'
import { tw } from 'share/theme'
import store from '../store'
import { computeContentBox, drawIcon } from '../lib/render'
import { getCheckboardStyle } from '../lib/checkboard'
import { CANVAS_SIZE } from '../types'

const PREVIEW_PADDING = 48
const PREVIEW_MIN = 240
const WHEEL_ZOOM_FACTOR = 1.08

const Preview = observer(function Preview() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    contentBox: number
  } | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onWheel = (event: WheelEvent) => {
      if (!store.source) return
      event.preventDefault()
      const factor =
        event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR
      store.updateIcon({
        imageScale: Math.round(store.icon.imageScale * factor),
      })
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return

    const render = () => {
      if (!store.source) return

      const rect = stage.getBoundingClientRect()
      const available = Math.floor(
        Math.min(rect.width, rect.height) - PREVIEW_PADDING * 2
      )
      const cssSize = clamp(available, PREVIEW_MIN, CANVAS_SIZE)
      const dpr = window.devicePixelRatio || 1
      const pixelSize = Math.min(CANVAS_SIZE, Math.round(cssSize * dpr))

      canvas.style.width = `${cssSize}px`
      canvas.style.height = `${cssSize}px`
      canvas.width = pixelSize
      canvas.height = pixelSize

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawIcon(
        ctx,
        store.sourceImageEl,
        store.icon,
        store.background,
        pixelSize
      )
    }

    render()

    const observer = new ResizeObserver(() => {
      render()
    })
    observer.observe(stage)

    return () => observer.disconnect()
  }, [store.previewVersion, store.source])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!store.source) return
    const contentBox = computeContentBox(
      store.icon,
      store.background,
      CANVAS_SIZE
    )
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: store.icon.offsetX,
      offsetY: store.icon.offsetY,
      contentBox,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const rect = e.currentTarget.getBoundingClientRect()
    const contentCss = rect.width * (drag.contentBox / CANVAS_SIZE)
    if (contentCss <= 0) return
    const dx = ((e.clientX - drag.startX) / contentCss) * 100
    const dy = ((e.clientY - drag.startY) / contentCss) * 100
    store.updateIcon({
      offsetX: clamp(drag.offsetX + dx, -50, 50),
      offsetY: clamp(drag.offsetY + dy, -50, 50),
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handleDoubleClick = () => {
    store.updateIcon({ offsetX: 0, offsetY: 0 })
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col relative">
      <div
        ref={stageRef}
        className="flex-1 flex items-center justify-center min-h-0 p-6"
      >
        <div
          className={className(
            'rounded-2xl shadow-lg overflow-hidden border',
            tw.border
          )}
          style={getCheckboardStyle(store.isDark)}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          />
        </div>
      </div>
    </div>
  )
})

export default Preview
