import { useEffect, useState, type RefObject } from 'react'
import clamp from 'licia/clamp'

const PADDING_X = 48

export function useFitScale(
  containerRef: RefObject<HTMLElement | null>,
  paperRef: RefObject<HTMLElement | null>
) {
  const [scale, setScale] = useState(1)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const paper = paperRef.current
    if (!container || !paper) return

    const update = () => {
      const paperWidth = paper.offsetWidth
      const paperHeight = paper.offsetHeight
      if (paperWidth <= 0) return

      const available = Math.max(container.clientWidth - PADDING_X, 1)
      const nextScale = clamp(available / paperWidth, 0.1, 1)
      setScale(nextScale)
      setWidth(paperWidth * nextScale)
      setHeight(paperHeight * nextScale)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    observer.observe(paper)
    return () => observer.disconnect()
  }, [containerRef, paperRef])

  return { scale, width, height }
}
