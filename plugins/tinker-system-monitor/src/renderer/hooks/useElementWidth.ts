import { useEffect, useState, type RefObject } from 'react'

export function useElementWidth<T>(
  ref: RefObject<HTMLElement | null>,
  map: (width: number) => T,
  initial: T
): T {
  const [value, setValue] = useState<T>(initial)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = (width: number) => {
      setValue(map(width))
    }

    update(el.getBoundingClientRect().width)

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) update(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, map])

  return value
}
