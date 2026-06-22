import { useEffect, useState } from 'react'

export function useContainerWidth(container: HTMLElement | null): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!container) {
      setWidth(0)
      return
    }

    const update = () => {
      setWidth(container.clientWidth)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)

    return () => observer.disconnect()
  }, [container])

  return width
}
