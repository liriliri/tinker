import { useRef, useState, useCallback } from 'react'
import clamp from 'licia/clamp'
import { tw } from 'share/theme'
import store from '../store'

interface WaveScrollbarProps {
  getScrollContainer: () => HTMLElement | null | undefined
  setScroll: (px: number) => void
}

function useWaveScrollbar({
  getScrollContainer,
  setScroll,
}: WaveScrollbarProps) {
  const [scrollThumb, setScrollThumb] = useState({ left: 0, width: 100 })
  const scrollbarRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const update = useCallback(() => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return
    const { scrollWidth, clientWidth, scrollLeft } = scrollContainer
    if (scrollWidth <= clientWidth) {
      setScrollThumb({ left: 0, width: 100 })
      return
    }
    const thumbWidth = clamp((clientWidth / scrollWidth) * 100, 8, 100)
    const thumbLeft =
      (scrollLeft / (scrollWidth - clientWidth)) * (100 - thumbWidth)
    setScrollThumb({ left: thumbLeft, width: thumbWidth })
  }, [getScrollContainer])

  const setScrollFromRatio = useCallback(
    (ratio: number) => {
      const scrollContainer = getScrollContainer()
      if (!scrollContainer) return
      const { scrollWidth, clientWidth } = scrollContainer
      const maxScroll = scrollWidth - clientWidth
      setScroll(clamp(ratio * maxScroll, 0, maxScroll))
      update()
    },
    [getScrollContainer, setScroll, update]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (store.isPlaying) return
      isDraggingRef.current = true
      const bar = scrollbarRef.current
      if (!bar) return

      const rect = bar.getBoundingClientRect()
      const barWidth = rect.width
      const thumbLeft = (scrollThumb.left / 100) * barWidth
      const thumbWidth = (scrollThumb.width / 100) * barWidth
      const clickX = e.clientX - rect.left

      const isOnThumb = clickX >= thumbLeft && clickX <= thumbLeft + thumbWidth
      const dragOffset = isOnThumb ? clickX - thumbLeft - thumbWidth / 2 : 0

      const getScrollRatio = (clientX: number) => {
        const x = clientX - rect.left - dragOffset
        return (x - thumbWidth / 2) / (barWidth - thumbWidth)
      }

      setScrollFromRatio(getScrollRatio(e.clientX))

      const onMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return
        setScrollFromRatio(getScrollRatio(e.clientX))
      }
      const onMouseUp = () => {
        isDraggingRef.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [scrollThumb, setScrollFromRatio]
  )

  return { scrollThumb, scrollbarRef, update, onMouseDown }
}

interface WaveScrollbarViewProps {
  scrollbarRef: React.RefObject<HTMLDivElement | null>
  scrollThumb: { left: number; width: number }
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function WaveScrollbarView({
  scrollbarRef,
  scrollThumb,
  onMouseDown,
}: WaveScrollbarViewProps) {
  return (
    <div
      ref={scrollbarRef}
      onMouseDown={onMouseDown}
      className={`relative h-2 mx-3 mb-1 mt-1 rounded-full cursor-pointer ${tw.bg.tertiary}`}
    >
      <div
        className={`absolute top-0 h-full rounded-full ${tw.primary.bg} opacity-60 hover:opacity-100 transition-opacity`}
        style={{
          left: `${scrollThumb.left}%`,
          width: `${scrollThumb.width}%`,
        }}
      />
    </div>
  )
}

export { useWaveScrollbar }
