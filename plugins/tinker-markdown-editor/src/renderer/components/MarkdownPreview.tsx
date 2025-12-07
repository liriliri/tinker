import { observer } from 'mobx-react-lite'
import { useEffect, useState, useRef } from 'react'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'
import store from '../store'

export default observer(function MarkdownPreview() {
  const [html, setHtml] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const convertMarkdown = async () => {
      if (!store.markdownInput) {
        setHtml('')
        return
      }

      try {
        const result = await remark()
          .use(remarkGfm)
          .use(remarkHtml)
          .process(store.markdownInput)

        setHtml(String(result))
      } catch (err) {
        console.error('Failed to convert markdown:', err)
        setHtml('<p style="color: red;">Failed to render markdown</p>')
      }
    }

    convertMarkdown()
  }, [store.markdownInput])

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
    if (!container) {
      return
    }

    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const maxScroll = scrollHeight - clientHeight

    if (maxScroll <= 0) return

    const currentScrollTop = container.scrollTop
    const currentPercent = maxScroll > 0 ? currentScrollTop / maxScroll : 0

    // Only sync if there's a meaningful difference
    if (Math.abs(currentPercent - store.scrollPercent) > 0.001) {
      const targetScrollTop = maxScroll * store.scrollPercent
      container.scrollTop = targetScrollTop
    }
  }, [store.scrollPercent])

  return (
    <div
      ref={containerRef}
      className="markdown-preview-container h-full w-full overflow-auto p-6 bg-white dark:bg-[#1e1e1e]"
      data-color-mode={store.isDark ? 'dark' : 'light'}
    >
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
})
