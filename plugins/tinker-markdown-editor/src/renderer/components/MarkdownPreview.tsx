import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function MarkdownPreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    if (!store.markdownInput) {
      contentRef.current.innerHTML = ''
      return
    }

    try {
      Vditor.preview(contentRef.current, store.markdownInput, {
        mode: store.isDark ? 'dark' : 'light',
        theme: {
          current: store.isDark ? 'dark' : 'light',
        },
      })
    } catch (err) {
      console.error('Failed to convert markdown:', err)
      contentRef.current.innerHTML =
        '<p class="text-red-500">Failed to render markdown</p>'
    }
  }, [store.markdownInput, store.isDark])

  // Handle scroll event from preview
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight

      const maxScroll = scrollHeight - clientHeight
      const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0

      // Only update if scrollPercent actually changed
      if (Math.abs(store.scrollPercent - scrollPercent) > 0.001) {
        store.setScrollPercent(scrollPercent)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Sync scroll from editor to preview
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const maxScroll = scrollHeight - clientHeight

    if (maxScroll <= 0) return

    const currentScrollTop = container.scrollTop
    const currentPercent = currentScrollTop / maxScroll

    // Only sync if there's a meaningful difference
    if (Math.abs(currentPercent - store.scrollPercent) > 0.001) {
      container.scrollTop = maxScroll * store.scrollPercent
    }
  }, [store.scrollPercent])

  return (
    <div
      ref={containerRef}
      className={`markdown-preview-container h-full w-full overflow-auto p-6 ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
    >
      <div
        ref={contentRef}
        className={`vditor-reset ${store.isDark ? 'vditor-reset--dark' : ''}`}
      />
    </div>
  )
})
