import clamp from 'licia/clamp'
import debounce from 'licia/debounce'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  computeFitRatio,
  computeFitRect,
  VIEWER_IMAGE_FIT_AREA,
  type ImageRect,
  zoomRectAtPivot,
} from './viewerLayout'

const MIN_RATIO = 0.05
const MAX_RATIO = 20
const ANIMATION_DURATION = 300
const WHEEL_ZOOM_SENSITIVITY = 0.0008

interface ZoomPanImageProps {
  src: string
  alt: string
  className?: string
  fitArea?: number
  enableZoom?: boolean
  enablePan?: boolean
  showRatio?: boolean
  naturalWidthHint?: number
  naturalHeightHint?: number
  onError?: () => void
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

function setCanvasBackingStore(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return null

  const pixelWidth = Math.max(1, Math.round(cssWidth * devicePixelRatio))
  const pixelHeight = Math.max(1, Math.round(cssHeight * devicePixelRatio))

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }

  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

  return ctx
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

export default function ZoomPanImage({
  src,
  alt,
  className = '',
  fitArea = VIEWER_IMAGE_FIT_AREA,
  enableZoom = true,
  enablePan = true,
  showRatio = true,
  naturalWidthHint = 0,
  naturalHeightHint = 0,
  onError,
}: ZoomPanImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<ImageBitmap | null>(null)
  const ratioElRef = useRef<HTMLDivElement>(null)
  const ratioTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transform = useRef<ImageTransform>(createEmptyTransform())
  const isLoaded = useRef(false)
  const enableZoomRef = useRef(enableZoom)
  enableZoomRef.current = enableZoom
  const fitRatioRef = useRef(1)
  const rafId = useRef<number | null>(null)
  const animationId = useRef<number | null>(null)
  const cssSize = useRef({ width: 0, height: 0 })
  const loadGeneration = useRef(0)

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const { width, height } = cssSize.current
    if (!width || !height) return

    const ctx = setCanvasBackingStore(
      canvas,
      width,
      height,
      window.devicePixelRatio || 1
    )
    if (!ctx) return

    const { rect, naturalWidth, naturalHeight } = transform.current
    ctx.clearRect(0, 0, width, height)

    if (!rect.width || !rect.height) return

    const clipLeft = Math.max(0, rect.left)
    const clipTop = Math.max(0, rect.top)
    const clipRight = Math.min(width, rect.left + rect.width)
    const clipBottom = Math.min(height, rect.top + rect.height)
    const clipWidth = clipRight - clipLeft
    const clipHeight = clipBottom - clipTop

    if (clipWidth <= 0 || clipHeight <= 0) return

    const srcX = ((clipLeft - rect.left) / rect.width) * naturalWidth
    const srcY = ((clipTop - rect.top) / rect.height) * naturalHeight
    const srcWidth = (clipWidth / rect.width) * naturalWidth
    const srcHeight = (clipHeight / rect.height) * naturalHeight

    ctx.save()
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      image,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      clipLeft,
      clipTop,
      clipWidth,
      clipHeight
    )
    ctx.restore()
  }, [])

  const schedulePaint = useCallback(() => {
    if (rafId.current !== null) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      paint()
    })
  }, [paint])

  const stopAnimation = useCallback(() => {
    if (animationId.current !== null) {
      cancelAnimationFrame(animationId.current)
      animationId.current = null
    }
  }, [])

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

    cssSize.current = { width: cw, height: ch }
    const rect = computeFitRect(naturalWidth, naturalHeight, cw, ch, fitArea)
    fitRatioRef.current = rect.width / naturalWidth

    transform.current = {
      ...transform.current,
      rect,
      ratio: fitRatioRef.current,
    }

    schedulePaint()
  }, [fitArea, schedulePaint])

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
        schedulePaint()

        if (progress < 1) {
          animationId.current = requestAnimationFrame(step)
          return
        }

        animationId.current = null
        onComplete?.()
      }

      animationId.current = requestAnimationFrame(step)
    },
    [schedulePaint, stopAnimation]
  )

  const zoomTo = useCallback(
    (ratio: number, pivot?: { x: number; y: number }, animated = false) => {
      const data = transform.current
      const { naturalWidth, naturalHeight } = data
      if (!naturalWidth || !naturalHeight || !data.rect.width) return

      const nextRatio = clamp(ratio, MIN_RATIO, MAX_RATIO)
      const nextRect = zoomRectAtPivot(
        data.rect,
        naturalWidth,
        naturalHeight,
        nextRatio,
        pivot
      )

      const applyTransform = (nextRect: ImageRect, nextRatio: number) => {
        data.rect = nextRect
        data.ratio = nextRatio
        schedulePaint()
        showRatioPopup(nextRatio)
      }

      if (animated) {
        animateToRect(nextRect, () => applyTransform(nextRect, nextRatio))
        return
      }

      applyTransform(nextRect, nextRatio)
    },
    [animateToRect, schedulePaint, showRatioPopup]
  )

  const zoomByFactor = useCallback(
    (factor: number, pivot: { x: number; y: number }) => {
      const { rect, naturalWidth } = transform.current
      if (!rect.width || !naturalWidth) return

      zoomTo((rect.width * factor) / naturalWidth, pivot)
    },
    [zoomTo]
  )

  const zoomByFactorRef = useRef(zoomByFactor)
  zoomByFactorRef.current = zoomByFactor

  const applyLoadedDimensions = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      const prev = transform.current
      const hadLayout =
        prev.naturalWidth > 0 && prev.naturalHeight > 0 && prev.rect.width > 0
      const dimensionsMatch =
        Math.abs(prev.naturalWidth - naturalWidth) <= 1 &&
        Math.abs(prev.naturalHeight - naturalHeight) <= 1

      prev.naturalWidth = naturalWidth
      prev.naturalHeight = naturalHeight
      isLoaded.current = true

      if (hadLayout && dimensionsMatch) {
        fitRatioRef.current = prev.rect.width / naturalWidth
        prev.ratio = fitRatioRef.current
      } else {
        reset()
      }

      paint()
    },
    [paint, reset]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (!enableZoomRef.current || !isLoaded.current) return

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
      if (!enablePan || event.button !== 0 || !isLoaded.current) return
      stopAnimation()
      isDragging.current = true
      dragStart.current = { x: event.clientX, y: event.clientY }
      dragOrigin.current = {
        left: transform.current.rect.left,
        top: transform.current.rect.top,
      }
      containerRef.current?.setPointerCapture(event.pointerId)
    },
    [enablePan, stopAnimation]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging.current) return
      transform.current.rect.left =
        dragOrigin.current.left + (event.clientX - dragStart.current.x)
      transform.current.rect.top =
        dragOrigin.current.top + (event.clientY - dragStart.current.y)
      schedulePaint()
    },
    [schedulePaint]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    containerRef.current?.releasePointerCapture(event.pointerId)
  }, [])

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

      if (isAtFit) {
        zoomTo(1, { x: pointerX, y: pointerY }, true)
      } else {
        const targetRect = computeFitRect(
          naturalWidth,
          naturalHeight,
          cw,
          ch,
          fitArea
        )
        animateToRect(targetRect, () => {
          fitRatioRef.current = targetRect.width / naturalWidth
          transform.current = {
            ...transform.current,
            rect: targetRect,
            ratio: fitRatioRef.current,
          }
        })
      }
    },
    [animateToRect, enableZoom, fitArea, zoomTo]
  )

  const loadImage = useCallback(
    async (imageSrc: string, generation: number) => {
      const img = new Image()
      img.decoding = 'async'
      img.alt = alt

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = imageSrc
      })

      if (generation !== loadGeneration.current) return

      const bitmap = await createImageBitmap(img)
      if (generation !== loadGeneration.current) {
        bitmap.close()
        return
      }

      imageRef.current?.close()
      imageRef.current = bitmap
      applyLoadedDimensions(bitmap.width, bitmap.height)
    },
    [alt, applyLoadedDimensions]
  )

  const prevSrc = useRef<string | undefined>(undefined)

  useLayoutEffect(() => {
    const isSrcChange = prevSrc.current !== undefined && prevSrc.current !== src
    prevSrc.current = src

    if (isSrcChange) {
      loadGeneration.current += 1
      stopAnimation()
    }

    const generation = loadGeneration.current
    void loadImage(src, generation).catch(() => {
      if (generation === loadGeneration.current) {
        onError?.()
      }
    })
  }, [src, loadImage, onError, stopAnimation])

  useLayoutEffect(() => {
    if (
      !isLoaded.current &&
      naturalWidthHint > 0 &&
      naturalHeightHint > 0 &&
      containerRef.current
    ) {
      const { width: cw, height: ch } =
        containerRef.current.getBoundingClientRect()
      if (cw && ch) {
        cssSize.current = { width: cw, height: ch }
        const rect = computeFitRect(
          naturalWidthHint,
          naturalHeightHint,
          cw,
          ch,
          fitArea
        )
        transform.current = {
          ...transform.current,
          naturalWidth: naturalWidthHint,
          naturalHeight: naturalHeightHint,
          rect,
          ratio: rect.width / naturalWidthHint,
        }
        schedulePaint()
      }
    }
  }, [fitArea, naturalHeightHint, naturalWidthHint, schedulePaint])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      cssSize.current = { width, height }
      if (!isLoaded.current) return
      debouncedReset.current()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
      stopAnimation()
      imageRef.current?.close()
      imageRef.current = null
    }
  }, [stopAnimation])

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full touch-none overflow-hidden ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full select-none"
        aria-label={alt}
        role="img"
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
