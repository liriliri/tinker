import clamp from 'licia/clamp'
import debounce from 'licia/debounce'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { LoadingCircle } from 'share/components/Loading'
import { tw } from 'share/theme'
import {
  PREVIEW_FIT_AREA,
  computeFitRatio,
  computeFitRect,
  zoomRectAtPivot,
  type ImageRect,
} from '../lib/zoomPanLayout'
import store from '../store'

const MIN_RATIO = 0.05
const MAX_RATIO = 20
const ANIMATION_DURATION = 300
const WHEEL_ZOOM_SENSITIVITY = 0.0008

interface ImageTransform {
  rect: ImageRect
  naturalWidth: number
  naturalHeight: number
  ratio: number
}

function createEmptyTransform(): ImageTransform {
  return {
    rect: { left: 0, top: 0, width: 0, height: 0 },
    naturalWidth: 0,
    naturalHeight: 0,
    ratio: 1,
  }
}

function applyCanvasLayout(
  canvas: HTMLCanvasElement,
  rect: ImageRect,
  naturalWidth: number,
  naturalHeight: number,
  fileName: string
) {
  if (!rect.width || !rect.height || !naturalWidth || !naturalHeight) {
    canvas.style.display = 'none'
    return
  }

  canvas.style.display = 'block'
  canvas.style.position = 'absolute'
  canvas.style.left = `${rect.left}px`
  canvas.style.top = `${rect.top}px`
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  canvas.style.maxWidth = 'none'
  canvas.style.maxHeight = 'none'
  canvas.style.pointerEvents = 'none'
  canvas.setAttribute('aria-label', fileName)
  canvas.setAttribute('role', 'img')
}

function lerpRect(from: ImageRect, to: ImageRect, progress: number): ImageRect {
  const t = clamp(progress, 0, 1)
  return {
    left: from.left + (to.left - from.left) * t,
    top: from.top + (to.top - from.top) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  }
}

const ImagePreview = observer(function ImagePreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const ratioElRef = useRef<HTMLDivElement>(null)
  const ratioTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transform = useRef<ImageTransform>(createEmptyTransform())
  const isReady = useRef(false)
  const fitRatioRef = useRef(1)
  const rafId = useRef<number | null>(null)
  const animationId = useRef<number | null>(null)
  const imageKeyRef = useRef('')

  useEffect(() => {
    store.initRenderer()
    return () => store.disposeRenderer()
  }, [])

  void store.previewVersion

  const updateCanvasLayout = useCallback(() => {
    const canvas = store.previewCanvas
    if (!canvas) return

    const { rect, naturalWidth, naturalHeight } = transform.current
    applyCanvasLayout(
      canvas,
      rect,
      naturalWidth,
      naturalHeight,
      store.image?.fileName ?? ''
    )
  }, [])

  const scheduleLayout = useCallback(() => {
    if (rafId.current !== null) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      updateCanvasLayout()
    })
  }, [updateCanvasLayout])

  const stopAnimation = useCallback(() => {
    if (animationId.current !== null) {
      cancelAnimationFrame(animationId.current)
      animationId.current = null
    }
  }, [])

  const showRatioPopup = useCallback((ratio: number) => {
    if (!ratioElRef.current) return
    ratioElRef.current.textContent = `${Math.round(ratio * 100)}%`
    ratioElRef.current.style.opacity = '1'
    if (ratioTimer.current) clearTimeout(ratioTimer.current)
    ratioTimer.current = setTimeout(() => {
      if (ratioElRef.current) {
        ratioElRef.current.style.opacity = '0'
      }
    }, 1000)
  }, [])

  const reset = useCallback(() => {
    const container = containerRef.current
    if (!container || !isReady.current) return

    const { naturalWidth: nw, naturalHeight: nh } = transform.current
    if (!nw || !nh) return

    const { width: cw, height: ch } = container.getBoundingClientRect()
    if (!cw || !ch) return

    const rect = computeFitRect(nw, nh, cw, ch, PREVIEW_FIT_AREA)
    fitRatioRef.current = rect.width / nw

    transform.current = {
      ...transform.current,
      rect,
      ratio: fitRatioRef.current,
    }

    scheduleLayout()
  }, [scheduleLayout])

  const resetRef = useRef(reset)
  resetRef.current = reset
  const debouncedReset = useRef(debounce(() => resetRef.current(), 20))

  const animateToRect = useCallback(
    (targetRect: ImageRect, onComplete?: () => void) => {
      stopAnimation()
      const startRect = { ...transform.current.rect }
      const startTime = performance.now()

      const step = (now: number) => {
        const progress = clamp((now - startTime) / ANIMATION_DURATION, 0, 1)
        const eased = 1 - (1 - progress) ** 3
        transform.current.rect = lerpRect(startRect, targetRect, eased)
        scheduleLayout()

        if (progress < 1) {
          animationId.current = requestAnimationFrame(step)
          return
        }

        animationId.current = null
        onComplete?.()
      }

      animationId.current = requestAnimationFrame(step)
    },
    [scheduleLayout, stopAnimation]
  )

  const zoomTo = useCallback(
    (ratio: number, pivot?: { x: number; y: number }, animated = false) => {
      const data = transform.current
      const { naturalWidth: nw, naturalHeight: nh } = data
      if (!nw || !nh || !data.rect.width) return

      const nextRatio = clamp(ratio, MIN_RATIO, MAX_RATIO)
      const nextRect = zoomRectAtPivot(data.rect, nw, nh, nextRatio, pivot)

      const applyTransform = (rect: ImageRect, ratio: number) => {
        data.rect = rect
        data.ratio = ratio
        scheduleLayout()
        showRatioPopup(ratio)
      }

      if (animated) {
        animateToRect(nextRect, () => applyTransform(nextRect, nextRatio))
        return
      }

      applyTransform(nextRect, nextRatio)
    },
    [animateToRect, scheduleLayout, showRatioPopup]
  )

  const zoomByFactor = useCallback(
    (factor: number, pivot: { x: number; y: number }) => {
      const { rect, naturalWidth: nw } = transform.current
      if (!rect.width || !nw) return
      zoomTo((rect.width * factor) / nw, pivot)
    },
    [zoomTo]
  )

  const zoomByFactorRef = useRef(zoomByFactor)
  zoomByFactorRef.current = zoomByFactor

  const applyDimensions = useCallback(
    (width: number, height: number) => {
      transform.current.naturalWidth = width
      transform.current.naturalHeight = height
      isReady.current = true
      reset()
    },
    [reset]
  )

  const image = store.image
  const naturalWidth = image?.width ?? 0
  const naturalHeight = image?.height ?? 0

  useLayoutEffect(() => {
    const host = hostRef.current
    const canvas = store.previewCanvas
    if (!host || !canvas || naturalWidth <= 0 || naturalHeight <= 0) {
      isReady.current = false
      return
    }

    if (canvas.parentElement !== host) {
      host.appendChild(canvas)
    }

    const nextKey = `${naturalWidth}x${naturalHeight}`
    const isNewImage = imageKeyRef.current !== nextKey
    imageKeyRef.current = nextKey

    if (isNewImage) {
      stopAnimation()
      applyDimensions(naturalWidth, naturalHeight)
      return
    }

    scheduleLayout()
  }, [naturalWidth, naturalHeight, applyDimensions, scheduleLayout, stopAnimation, store.previewCanvas, store.previewVersion])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (!isReady.current) return

      stopAnimation()

      let delta = event.deltaY
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 16
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        delta *= container.clientHeight
      }

      const factor = Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY)
      const rect = container.getBoundingClientRect()
      zoomByFactorRef.current(factor, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [stopAnimation])

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragOrigin = useRef({ left: 0, top: 0 })

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0 || !isReady.current) return
      stopAnimation()
      isDragging.current = true
      dragStart.current = { x: event.clientX, y: event.clientY }
      dragOrigin.current = {
        left: transform.current.rect.left,
        top: transform.current.rect.top,
      }
      containerRef.current?.setPointerCapture(event.pointerId)
    },
    [stopAnimation]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging.current) return
      transform.current.rect.left =
        dragOrigin.current.left + (event.clientX - dragStart.current.x)
      transform.current.rect.top =
        dragOrigin.current.top + (event.clientY - dragStart.current.y)
      scheduleLayout()
    },
    [scheduleLayout]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    containerRef.current?.releasePointerCapture(event.pointerId)
  }, [])

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isReady.current || !containerRef.current) return

      const { naturalWidth: nw, naturalHeight: nh, ratio } = transform.current
      if (!nw || !nh) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const { width: cw, height: ch } = containerRect
      const fitRatio = computeFitRatio(nw, nh, cw, ch, PREVIEW_FIT_AREA)
      const pointerX = event.clientX - containerRect.left
      const pointerY = event.clientY - containerRect.top
      const isAtFit = Math.abs(ratio - fitRatio) < 0.01

      if (isAtFit) {
        zoomTo(1, { x: pointerX, y: pointerY }, true)
      } else {
        const targetRect = computeFitRect(nw, nh, cw, ch, PREVIEW_FIT_AREA)
        animateToRect(targetRect, () => {
          fitRatioRef.current = targetRect.width / nw
          transform.current = {
            ...transform.current,
            rect: targetRect,
            ratio: fitRatioRef.current,
          }
        })
      }
    },
    [animateToRect, zoomTo]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      if (!isReady.current) return
      debouncedReset.current()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
      stopAnimation()
      if (ratioTimer.current) clearTimeout(ratioTimer.current)
    }
  }, [stopAnimation])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {store.isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <LoadingCircle className="w-8 h-8" />
        </div>
      )}

      {store.hasImage && store.previewCanvas && (
        <>
          <div ref={hostRef} className="absolute inset-0 overflow-hidden" />
          <div
            ref={ratioElRef}
            className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs opacity-0 transition-opacity duration-300 ${tw.bg.tertiary} ${tw.text.primary}`}
          >
            100%
          </div>
        </>
      )}
    </div>
  )
})

export default ImagePreview
