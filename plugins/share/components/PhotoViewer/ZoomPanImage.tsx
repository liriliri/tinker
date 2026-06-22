import clamp from 'licia/clamp'
import debounce from 'licia/debounce'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  computeFitRatio,
  computeFitRect,
  type ImageRect,
  zoomRectAtPivot,
} from '../../lib/viewerLayout'

const MIN_RATIO = 0.05
const MAX_RATIO = 20
const WHEEL_INTERVAL = 50
const IMAGE_TRANSITION = 'all 0.3s'

export interface ZoomPanImageProps {
  src: string
  alt: string
  className?: string
  fitArea?: number
  highResLoaded?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  showRatio?: boolean
  onLoad?: () => void
  onError?: () => void
  onZoomChange?: (isZoomed: boolean) => void
}

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

export default function ZoomPanImage({
  src,
  alt,
  className = '',
  fitArea = 0.9,
  highResLoaded = true,
  enableZoom = true,
  enablePan = true,
  showRatio = true,
  onLoad,
  onError,
  onZoomChange,
}: ZoomPanImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const ratioElRef = useRef<HTMLDivElement>(null)
  const ratioTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transform = useRef<ImageTransform>(createEmptyTransform())
  const isLoaded = useRef(false)
  const transitionEnabled = useRef(false)
  const isWheeling = useRef(false)
  const fitRatioRef = useRef(1)

  const applyRender = useCallback(() => {
    const img = imgRef.current
    if (!img) return

    const { rect } = transform.current
    img.style.transition = transitionEnabled.current ? IMAGE_TRANSITION : 'none'
    img.style.width = `${rect.width}px`
    img.style.height = `${rect.height}px`
    img.style.left = `${rect.left}px`
    img.style.top = `${rect.top}px`
    img.style.transform = ''
  }, [])

  const notifyZoom = useCallback(() => {
    if (!onZoomChange || !isLoaded.current) return
    const { ratio } = transform.current
    const fitRatio = fitRatioRef.current
    const isZoomed = Math.abs(ratio - fitRatio) > 0.01
    onZoomChange(isZoomed)
  }, [onZoomChange])

  const showRatioPopup = useCallback(
    (ratio: number) => {
      if (!showRatio || !ratioElRef.current) return
      ratioElRef.current.textContent = `${Math.round(ratio * 100)}%`
      ratioElRef.current.style.opacity = '1'
      if (ratioTimer.current) clearTimeout(ratioTimer.current)
      ratioTimer.current = setTimeout(() => {
        if (ratioElRef.current) {
          ratioElRef.current.style.opacity = '0'
        }
      }, 1000)
    },
    [showRatio]
  )

  const reset = useCallback(() => {
    const container = containerRef.current
    if (!container || !isLoaded.current) return

    const { naturalWidth, naturalHeight } = transform.current
    if (!naturalWidth || !naturalHeight) return

    const { width: cw, height: ch } = container.getBoundingClientRect()
    if (!cw || !ch) return

    const rect = computeFitRect(naturalWidth, naturalHeight, cw, ch, fitArea)
    fitRatioRef.current = rect.width / naturalWidth

    transform.current = {
      ...transform.current,
      rect,
      ratio: fitRatioRef.current,
    }

    transitionEnabled.current = false
    applyRender()
    notifyZoom()
    requestAnimationFrame(() => {
      setTimeout(() => {
        transitionEnabled.current = true
      }, 0)
    })
  }, [applyRender, fitArea, notifyZoom])

  const debouncedReset = useRef(debounce(() => reset(), 20))

  const zoomTo = useCallback(
    (ratio: number, pivot?: { x: number; y: number }) => {
      const data = transform.current
      const { naturalWidth, naturalHeight } = data
      if (!naturalWidth || !naturalHeight || !data.rect.width) return

      const nextRatio = clamp(ratio, MIN_RATIO, MAX_RATIO)
      data.rect = zoomRectAtPivot(
        data.rect,
        naturalWidth,
        naturalHeight,
        nextRatio,
        pivot
      )
      data.ratio = nextRatio

      applyRender()
      showRatioPopup(nextRatio)
      notifyZoom()
    },
    [applyRender, notifyZoom, showRatioPopup]
  )

  const zoom = useCallback(
    (delta: number, pivot?: { x: number; y: number }) => {
      const { rect, naturalWidth } = transform.current
      if (!rect.width || !naturalWidth) return

      const factor = delta < 0 ? 1 / (1 - delta) : 1 + delta
      zoomTo((rect.width * factor) / naturalWidth, pivot)
    },
    [zoomTo]
  )

  const applyLoadedDimensions = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      transform.current.naturalWidth = naturalWidth
      transform.current.naturalHeight = naturalHeight
      isLoaded.current = true
      reset()
      onLoad?.()
    },
    [onLoad, reset]
  )

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault()
      if (!enableZoom || isWheeling.current || !isLoaded.current) return

      isWheeling.current = true
      setTimeout(() => {
        isWheeling.current = false
      }, WHEEL_INTERVAL)

      const container = containerRef.current
      if (!container) return

      const delta = event.deltaY > 0 ? 1 : -1
      const rect = container.getBoundingClientRect()
      zoom(-delta * 0.1, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    },
    [enableZoom, zoom]
  )

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragOrigin = useRef({ left: 0, top: 0 })

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enablePan || event.button !== 0 || !isLoaded.current) return
      isDragging.current = true
      dragStart.current = { x: event.clientX, y: event.clientY }
      dragOrigin.current = {
        left: transform.current.rect.left,
        top: transform.current.rect.top,
      }
      transitionEnabled.current = false
      applyRender()
      containerRef.current?.setPointerCapture(event.pointerId)
    },
    [applyRender, enablePan]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging.current) return
      transform.current.rect.left =
        dragOrigin.current.left + (event.clientX - dragStart.current.x)
      transform.current.rect.top =
        dragOrigin.current.top + (event.clientY - dragStart.current.y)
      applyRender()
    },
    [applyRender]
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging.current) return
      isDragging.current = false
      containerRef.current?.releasePointerCapture(event.pointerId)
      transitionEnabled.current = true
      applyRender()
    },
    [applyRender]
  )

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!enableZoom || !isLoaded.current || !containerRef.current) return

      const { naturalWidth, naturalHeight, ratio } = transform.current
      if (!naturalWidth || !naturalHeight) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const { width: cw, height: ch } = containerRect
      const fitRatio = computeFitRatio(
        naturalWidth,
        naturalHeight,
        cw,
        ch,
        fitArea
      )
      const pointerX = event.clientX - containerRect.left
      const pointerY = event.clientY - containerRect.top
      const isAtFit = Math.abs(ratio - fitRatio) < 0.01

      transitionEnabled.current = true
      if (isAtFit) {
        zoomTo(1, { x: pointerX, y: pointerY })
      } else {
        reset()
      }
    },
    [enableZoom, fitArea, reset, zoomTo]
  )

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget
      applyLoadedDimensions(img.naturalWidth, img.naturalHeight)
    },
    [applyLoadedDimensions]
  )

  const prevSrc = useRef<string | undefined>(undefined)

  useLayoutEffect(() => {
    const isSrcChange = prevSrc.current !== undefined && prevSrc.current !== src
    prevSrc.current = src

    if (isSrcChange) {
      isLoaded.current = false
      transform.current = createEmptyTransform()
      transitionEnabled.current = false
      const img = imgRef.current
      if (img) {
        img.style.width = ''
        img.style.height = ''
        img.style.left = ''
        img.style.top = ''
        img.style.transform = ''
        img.style.transition = ''
      }
    }

    const img = imgRef.current
    if (img?.complete && img.naturalWidth) {
      applyLoadedDimensions(img.naturalWidth, img.naturalHeight)
    }
  }, [src, applyLoadedDimensions])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      if (!isLoaded.current) return
      debouncedReset.current()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full touch-none overflow-hidden ${className}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        loading="eager"
        className={`absolute max-w-none select-none transition-opacity duration-300 ${
          highResLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={() => onError?.()}
      />
      {showRatio && (
        <div
          ref={ratioElRef}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-300"
        >
          100%
        </div>
      )}
    </div>
  )
}
