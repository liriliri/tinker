import { RefObject, useEffect, useState } from 'react'

interface UseInViewOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number
}

export function useInView(
  ref: RefObject<Element | null>,
  options: UseInViewOptions = {}
): boolean {
  const { root = null, rootMargin = '300px', threshold = 0 } = options
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting))
      },
      { root, rootMargin, threshold }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, root, rootMargin, threshold])

  return inView
}
