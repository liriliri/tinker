import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  threshold?: number // Distance from bottom to trigger load (in pixels)
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  threshold = 100,
}: UseInfiniteScrollOptions) {
  const isLoadingRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingRef.current || !hasMore) return

      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop
      const windowHeight =
        document.documentElement.clientHeight || document.body.clientHeight
      const scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight

      if (scrollTop + windowHeight >= scrollHeight - threshold) {
        isLoadingRef.current = true
        onLoadMore()
        // Reset after a short delay to allow content to render
        setTimeout(() => {
          isLoadingRef.current = false
        }, 500)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onLoadMore, hasMore, threshold])
}
