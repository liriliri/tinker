import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { tw } from 'share/theme'
import store from '../store'
import Thumbnail from './Thumbnail'
import Outline from './Outline'
import { LayoutGrid, List } from 'lucide-react'

export default observer(function ThumbnailSidebar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Scroll to current thumbnail when page changes
  useEffect(() => {
    if (!store.pdfDoc || store.sidebarView !== 'thumbnails') return

    const thumbnailDiv = thumbnailRefs.current.get(store.currentPage)
    if (thumbnailDiv && containerRef.current) {
      const container = containerRef.current
      const thumbnailRect = thumbnailDiv.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      // Check if thumbnail is fully visible
      const isVisible =
        thumbnailRect.top >= containerRect.top &&
        thumbnailRect.bottom <= containerRect.bottom

      if (!isVisible) {
        thumbnailDiv.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [store.currentPage, store.pdfDoc, store.sidebarView])

  const handleThumbnailClick = (pageNum: number) => {
    store.setCurrentPage(pageNum)
    store.scrollToPage = pageNum
  }

  if (!store.pdfDoc) {
    return null
  }

  const pages = Array.from({ length: store.numPages }, (_, i) => i + 1)

  return (
    <div
      className={`
        w-48 h-full flex flex-col
        border-r ${tw.border.both}
        ${tw.bg.light.primary} ${tw.bg.dark.primary}
      `}
    >
      {/* Content area */}
      {store.sidebarView === 'thumbnails' ? (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            scrollbarWidth: 'thin',
          }}
        >
          <div className="py-2">
            {pages.map((pageNum) => (
              <div
                key={pageNum}
                ref={(el) => {
                  if (el) {
                    thumbnailRefs.current.set(pageNum, el)
                  } else {
                    thumbnailRefs.current.delete(pageNum)
                  }
                }}
              >
                <Thumbnail
                  pageNum={pageNum}
                  pdfDoc={store.pdfDoc}
                  scale={store.scale}
                  isActive={pageNum === store.currentPage}
                  onClick={() => handleThumbnailClick(pageNum)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Outline />
      )}

      {/* View mode toggle buttons */}
      <div
        className={`
          flex border-t ${tw.border.both}
          ${tw.bg.light.primary} ${tw.bg.dark.primary}
        `}
      >
        <button
          onClick={() => store.setSidebarView('thumbnails')}
          className={`
            flex-1 flex items-center justify-center py-2 px-3
            transition-colors
            ${
              store.sidebarView === 'thumbnails'
                ? `${tw.bg.light.secondary} ${tw.bg.dark.secondary} ${tw.text.light.primary} ${tw.text.dark.primary}`
                : `${tw.hover.both} ${tw.text.light.secondary} ${tw.text.dark.secondary}`
            }
          `}
          title="Thumbnails"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          onClick={() => store.setSidebarView('outline')}
          className={`
            flex-1 flex items-center justify-center py-2 px-3
            transition-colors
            ${
              store.sidebarView === 'outline'
                ? `${tw.bg.light.secondary} ${tw.bg.dark.secondary} ${tw.text.light.primary} ${tw.text.dark.primary}`
                : `${tw.hover.both} ${tw.text.light.secondary} ${tw.text.dark.secondary}`
            }
          `}
          title="Outline"
        >
          <List size={16} />
        </button>
      </div>
    </div>
  )
})
