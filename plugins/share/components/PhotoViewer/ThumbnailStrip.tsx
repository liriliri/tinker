import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useInView } from '../../hooks/useInView'
import { getViewerThumbWidth } from './viewerLayout'
import ThumbnailHoverPreview from './ThumbnailHoverPreview'
import type { PhotoViewerItem } from './types'

const THUMB_ROOT_MARGIN = '160px'
const HOVER_OPEN_DELAY = 100

interface ThumbnailItemProps<T extends PhotoViewerItem> {
  item: T
  index: number
  isActive: boolean
  scrollRoot: Element | null
  onSelect: () => void
  onItemRef: (index: number, node: HTMLButtonElement | null) => void
  onHoverStart: (item: T, node: HTMLButtonElement) => void
  onHoverEnd: () => void
  getThumbnailUrl: (item: T) => Promise<string | null>
}

function ThumbnailItem<T extends PhotoViewerItem>({
  item,
  index,
  isActive,
  scrollRoot,
  onSelect,
  onItemRef,
  onHoverStart,
  onHoverEnd,
  getThumbnailUrl,
}: ThumbnailItemProps<T>) {
  const observeRef = useRef<HTMLButtonElement>(null)
  const inView = useInView(observeRef, {
    root: scrollRoot,
    rootMargin: THUMB_ROOT_MARGIN,
  })
  const [src, setSrc] = useState<string | null>(null)
  const width = getViewerThumbWidth(item.width, item.height)

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      observeRef.current = node
      onItemRef(index, node)
    },
    [index, onItemRef]
  )

  useEffect(() => {
    if (!inView) {
      setSrc(null)
      return
    }

    let cancelled = false
    setSrc(null)

    void getThumbnailUrl(item).then((url) => {
      if (!cancelled) setSrc(url)
    })

    return () => {
      cancelled = true
    }
  }, [getThumbnailUrl, inView, item.id])

  return (
    <button
      ref={setRefs}
      type="button"
      onClick={onSelect}
      onMouseEnter={() => {
        if (isActive) return
        const node = observeRef.current
        if (node) onHoverStart(item, node)
      }}
      onMouseLeave={onHoverEnd}
      style={{ width: `${width}px` }}
      className={`h-12 shrink-0 overflow-hidden rounded border-2 transition-all ${
        isActive
          ? 'scale-105 border-white opacity-100'
          : 'border-transparent opacity-50 grayscale hover:opacity-80 hover:grayscale-0'
      }`}
    >
      {src ? (
        <img
          src={src}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-white/10" />
      )}
    </button>
  )
}

const MemoThumbnailItem = memo(ThumbnailItem) as typeof ThumbnailItem

interface HoverPreviewState<T extends PhotoViewerItem> {
  item: T
  anchorRect: DOMRect
  boundsRect: DOMRect
}

export interface ThumbnailStripProps<T extends PhotoViewerItem> {
  items: T[]
  currentIndex: number
  boundsRef: RefObject<HTMLElement | null>
  onSelect: (index: number) => void
  getThumbnailUrl: (item: T) => Promise<string | null>
  getPreviewUrl: (item: T) => Promise<string | null>
  prefetchPreview?: (item: T) => void
}

function ThumbnailStrip<T extends PhotoViewerItem>({
  items,
  currentIndex,
  boundsRef,
  onSelect,
  getThumbnailUrl,
  getPreviewUrl,
  prefetchPreview,
}: ThumbnailStripProps<T>) {
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)
  const [hoverPreview, setHoverPreview] = useState<HoverPreviewState<T> | null>(
    null
  )
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const hoverTimerRef = useRef<number | undefined>(undefined)

  const setItemRef = useCallback(
    (index: number, node: HTMLButtonElement | null) => {
      itemRefs.current[index] = node
    },
    []
  )

  const hideHoverPreview = useCallback(() => {
    window.clearTimeout(hoverTimerRef.current)
    setHoverPreview(null)
  }, [])

  const showHoverPreview = useCallback(
    (item: T, node: HTMLButtonElement) => {
      window.clearTimeout(hoverTimerRef.current)
      prefetchPreview?.(item)
      hoverTimerRef.current = window.setTimeout(() => {
        const boundsRect = boundsRef.current?.getBoundingClientRect()
        if (!boundsRect) return

        setHoverPreview({
          item,
          anchorRect: node.getBoundingClientRect(),
          boundsRect,
        })
      }, HOVER_OPEN_DELAY)
    },
    [boundsRef, prefetchPreview]
  )

  useEffect(() => {
    const el = scrollRoot
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      el.scrollLeft += event.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scrollRoot])

  useEffect(() => {
    const el = scrollRoot
    if (!el) return

    const onScroll = () => hideHoverPreview()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [hideHoverPreview, scrollRoot])

  useEffect(() => {
    return () => window.clearTimeout(hoverTimerRef.current)
  }, [])

  useEffect(() => {
    itemRefs.current[currentIndex]?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [currentIndex])

  useEffect(() => {
    itemRefs.current.length = items.length
  }, [items.length])

  return (
    <>
      <div
        ref={setScrollRoot}
        className="scrollbar-hide flex h-16 shrink-0 items-center gap-1 overflow-x-auto px-3"
      >
        {items.map((item, index) => (
          <MemoThumbnailItem
            key={item.id}
            item={item}
            index={index}
            isActive={index === currentIndex}
            scrollRoot={scrollRoot}
            onSelect={() => onSelect(index)}
            onItemRef={setItemRef}
            onHoverStart={showHoverPreview}
            onHoverEnd={hideHoverPreview}
            getThumbnailUrl={getThumbnailUrl}
          />
        ))}
      </div>

      {hoverPreview ? (
        <ThumbnailHoverPreview
          item={hoverPreview.item}
          anchorRect={hoverPreview.anchorRect}
          boundsRect={hoverPreview.boundsRect}
          getPreviewUrl={getPreviewUrl}
          getThumbnailUrl={getThumbnailUrl}
        />
      ) : null}
    </>
  )
}

export default memo(ThumbnailStrip) as typeof ThumbnailStrip
