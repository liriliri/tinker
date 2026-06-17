import { useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import debounce from 'licia/debounce'
import clamp from 'licia/clamp'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'imageViewer'

addI18nNamespace(I18N_NS, {
  'en-US': {
    rotateLeft: 'Rotate Left',
    rotateRight: 'Rotate Right',
    flipHorizontal: 'Flip Horizontal',
    flipVertical: 'Flip Vertical',
    actualSize: 'Actual Size',
  },
  'zh-CN': {
    rotateLeft: '向左旋转',
    rotateRight: '向右旋转',
    flipHorizontal: '水平翻转',
    flipVertical: '垂直翻转',
    actualSize: '实际大小',
  },
})

export interface ImageViewerProps {
  src: string
  className?: string
  /** Use 'contain' or 'cover' when fitting the image to the container */
  fit?: 'contain' | 'cover'
  /** Max fraction of container used when fitting (0-1), e.g. 0.8 leaves margin around */
  fitArea?: number
  /** Called when image loads with natural dimensions */
  onLoad?: (naturalWidth: number, naturalHeight: number) => void
  /** Called when image fails to load */
  onError?: () => void
  /** Show zoom ratio indicator while scaling */
  showRatio?: boolean
}

interface ImageData {
  left: number
  top: number
  width: number
  height: number
  rotate: number
  flipH: boolean
  flipV: boolean
  naturalWidth: number
  naturalHeight: number
  ratio: number
}

const MIN_RATIO = 0.05
const MAX_RATIO = 20
const WHEEL_INTERVAL = 50
const IMAGE_TRANSITION = 'all 0.3s'

function createEmptyImageData(): ImageData {
  return {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    rotate: 0,
    flipH: false,
    flipV: false,
    naturalWidth: 0,
    naturalHeight: 0,
    ratio: 1,
  }
}

export default function ImageViewer({
  src,
  className = '',
  fit = 'contain',
  fitArea = 0.8,
  onLoad,
  onError,
  showRatio = true,
}: ImageViewerProps) {
  const { t } = useTranslation(I18N_NS)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const imageData = useRef<ImageData>(createEmptyImageData())
  const isLoaded = useRef(false)
  const transitionEnabled = useRef(false)

  const ratioElRef = useRef<HTMLDivElement>(null)
  const ratioTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const isWheeling = useRef(false)

  const setImageVisible = useCallback((visible: boolean) => {
    if (!imgRef.current) return
    imgRef.current.style.opacity = visible ? '1' : '0'
  }, [])

  const applyRender = useCallback(() => {
    if (!imgRef.current) return

    const { left, top, width, height, rotate, flipH, flipV } = imageData.current
    const el = imgRef.current

    el.style.transition = transitionEnabled.current ? IMAGE_TRANSITION : 'none'
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.transform = `rotate(${rotate}deg) scaleX(${
      flipH ? -1 : 1
    }) scaleY(${flipV ? -1 : 1})`
    el.style.transformOrigin = 'center center'
  }, [])

  const reset = useCallback(() => {
    const container = containerRef.current
    if (!container || !isLoaded.current) return

    const { naturalWidth: nw, naturalHeight: nh } = imageData.current
    if (!nw || !nh) return

    const rect = container.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height
    if (!cw || !ch) return

    const area = clamp(fitArea, 0, 1)

    let width = cw
    let height = ch

    if (fit === 'cover') {
      const scale = Math.max((cw * area) / nw, (ch * area) / nh)
      width = nw * scale
      height = nh * scale
    } else {
      const aspectRatio = nw / nh
      if (height * aspectRatio > width) {
        height = width / aspectRatio
      } else {
        width = height * aspectRatio
      }
      width = Math.min(width * area, nw)
      height = Math.min(height * area, nh)
    }

    const left = (cw - width) / 2
    const top = (ch - height) / 2
    const ratio = width / nw

    imageData.current = {
      left,
      top,
      width,
      height,
      rotate: 0,
      flipH: false,
      flipV: false,
      naturalWidth: nw,
      naturalHeight: nh,
      ratio,
    }

    transitionEnabled.current = false
    applyRender()
    setImageVisible(true)
    requestAnimationFrame(() => {
      setTimeout(() => {
        transitionEnabled.current = true
      }, 0)
    })
  }, [fit, fitArea, applyRender, setImageVisible])

  const debouncedReset = useRef(debounce(() => reset(), 20))

  const applyLoadedDimensions = useCallback(
    (nw: number, nh: number) => {
      imageData.current.naturalWidth = nw
      imageData.current.naturalHeight = nh
      isLoaded.current = true
      reset()
      onLoad?.(nw, nh)
    },
    [onLoad, reset]
  )

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

  const zoomTo = useCallback(
    (ratio: number, pivot?: { x: number; y: number }) => {
      const data = imageData.current
      const { naturalWidth, naturalHeight, width, height, left, top } = data
      if (!naturalWidth || !naturalHeight || !width || !height) return

      const nextRatio = clamp(ratio, MIN_RATIO, MAX_RATIO)
      const newWidth = naturalWidth * nextRatio
      const newHeight = naturalHeight * nextRatio
      const offsetWidth = newWidth - width
      const offsetHeight = newHeight - height

      data.width = newWidth
      data.height = newHeight
      data.ratio = nextRatio

      const pivotPoint = pivot ?? {
        x: width / 2 + left,
        y: height / 2 + top,
      }

      data.left -= offsetWidth * ((pivotPoint.x - left) / width)
      data.top -= offsetHeight * ((pivotPoint.y - top) / height)

      applyRender()
      showRatioPopup(nextRatio)
    },
    [applyRender, showRatioPopup]
  )

  const zoom = useCallback(
    (delta: number, pivot?: { x: number; y: number }) => {
      const { width, naturalWidth } = imageData.current
      if (!width || !naturalWidth) return

      const ratio = delta < 0 ? 1 / (1 - delta) : 1 + delta
      zoomTo((width * ratio) / naturalWidth, pivot)
    },
    [zoomTo]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      if (isWheeling.current || !containerRef.current || !isLoaded.current) {
        return
      }

      isWheeling.current = true
      setTimeout(() => {
        isWheeling.current = false
      }, WHEEL_INTERVAL)

      const delta = e.deltaY > 0 ? 1 : -1
      const rect = containerRef.current.getBoundingClientRect()
      zoom(-delta * 0.1, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    [zoom]
  )

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragOrigin = useRef({ left: 0, top: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || !isLoaded.current) return
      isDragging.current = true
      dragStart.current = { x: e.clientX, y: e.clientY }
      dragOrigin.current = {
        left: imageData.current.left,
        top: imageData.current.top,
      }
      transitionEnabled.current = false
      applyRender()
      containerRef.current?.setPointerCapture(e.pointerId)
    },
    [applyRender]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !imgRef.current) return
      imageData.current.left =
        dragOrigin.current.left + (e.clientX - dragStart.current.x)
      imageData.current.top =
        dragOrigin.current.top + (e.clientY - dragStart.current.y)
      applyRender()
    },
    [applyRender]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      isDragging.current = false
      containerRef.current?.releasePointerCapture(e.pointerId)
      transitionEnabled.current = true
      applyRender()
    },
    [applyRender]
  )

  const handleDoubleClick = useCallback(() => {
    reset()
  }, [reset])

  const rotateBy = useCallback(
    (delta: number) => {
      if (!isLoaded.current) return
      imageData.current.rotate += delta
      applyRender()
    },
    [applyRender]
  )

  const flipBy = useCallback(
    (axis: 'h' | 'v') => {
      if (!isLoaded.current) return
      if (axis === 'h') imageData.current.flipH = !imageData.current.flipH
      else imageData.current.flipV = !imageData.current.flipV
      applyRender()
    },
    [applyRender]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!isLoaded.current) return
      tinker.showContextMenu(e.clientX, e.clientY, [
        { label: t('rotateLeft'), click: () => rotateBy(-90) },
        { label: t('rotateRight'), click: () => rotateBy(90) },
        { type: 'separator' },
        { label: t('flipHorizontal'), click: () => flipBy('h') },
        { label: t('flipVertical'), click: () => flipBy('v') },
        { type: 'separator' },
        { label: t('actualSize'), click: () => zoomTo(1) },
      ])
    },
    [t, rotateBy, flipBy, zoomTo]
  )

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
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
      imageData.current = createEmptyImageData()
      transitionEnabled.current = false
      if (imgRef.current) {
        setImageVisible(false)
        imgRef.current.style.width = ''
        imgRef.current.style.height = ''
        imgRef.current.style.left = ''
        imgRef.current.style.top = ''
        imgRef.current.style.transform = ''
        imgRef.current.style.transition = ''
      }
    }

    const img = imgRef.current
    if (img?.complete && img.naturalWidth) {
      applyLoadedDimensions(img.naturalWidth, img.naturalHeight)
    }
  }, [src, applyLoadedDimensions, setImageVisible])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      if (!isLoaded.current) return
      debouncedReset.current()
    })
    observer.observe(container)
    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative w-full h-full touch-none ${className}`}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        ref={imgRef}
        src={src}
        draggable={false}
        className="absolute select-none max-w-none pointer-events-none"
        style={{
          maxWidth: 'none',
          opacity: 0,
        }}
        onLoad={handleLoad}
        onError={() => onError?.()}
      />
      {showRatio && (
        <div
          ref={ratioElRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white text-xs rounded-lg px-2 py-1 pointer-events-none opacity-0 transition-opacity duration-300"
        >
          100%
        </div>
      )}
    </div>
  )
}
