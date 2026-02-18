import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { tw } from 'share/theme'
import store from '../store'
import Thumbnail from './Thumbnail'
import Outline from './Outline'
import { LayoutGrid, List } from 'lucide-react'
import { THUMBNAIL_WIDTH } from '../lib/constants'

interface ThumbnailDimensions {
  width: number
  height: number
}

export default observer(function ThumbnailSidebar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [thumbnailDimensions, setThumbnailDimensions] = useState<
    Map<number, ThumbnailDimensions>
  >(new Map())

  // Pre-calculate thumbnail dimensions when document loads
  useEffect(() => {
    if (!store.pdfDoc) {
      setThumbnailDimensions(new Map())
      return
    }

    const initializeDimensions = async () => {
      const dimensions = new Map<number, ThumbnailDimensions>()

      try {
        if (!store.pdfDoc) return

        // Get the first page to determine default dimensions
        const firstPage = await store.pdfDoc.getPage(1)
        const viewport = firstPage.getViewport({ scale: 1 })

        // Calculate thumbnail dimensions (same logic as Thumbnail component)
        const ratio = viewport.width / viewport.height
        const width = THUMBNAIL_WIDTH
        const height = (width / ratio) | 0

        // Assume all pages have the same size (common case)
        for (let i = 1; i <= store.numPages; i++) {
          dimensions.set(i, { width, height })
        }

        setThumbnailDimensions(dimensions)
      } catch (error) {
        console.error('Error calculating thumbnail dimensions:', error)
      }
    }

    initializeDimensions()
  }, [store.pdfDoc, store.numPages])

  // Scroll to current thumbnail when page changes
  useEffect(() => {
    if (
      !store.pdfDoc ||
      store.sidebarView !== 'thumbnails' ||
      !store.sidebarOpen
    )
      return

    const thumbnailDiv = thumbnailRefs.current.get(store.currentPage)
    const container = containerRef.current

    if (!thumbnailDiv || !container) return

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const thumbnailRect = thumbnailDiv.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      // If dimensions are 0, the element is not visible (display: none), skip
      if (thumbnailRect.height === 0 || containerRect.height === 0) return

      // Check if thumbnail is fully visible
      const isVisible =
        thumbnailRect.top >= containerRect.top &&
        thumbnailRect.bottom <= containerRect.bottom

      if (!isVisible) {
        // Scroll the thumbnail into view
        thumbnailDiv.scrollIntoView({
          behavior: 'auto', // Use 'auto' instead of 'smooth' for instant scroll
          block: 'nearest',
        })
      }
    })
  }, [store.currentPage, store.pdfDoc, store.sidebarView, store.sidebarOpen])

  const handleThumbnailClick = (pageNum: number) => {
    store.setCurrentPage(pageNum)
    store.scrollToPage = pageNum
  }

  const pages = store.pdfDoc
    ? Array.from({ length: store.numPages }, (_, i) => i + 1)
    : []

  // Hide sidebar if not open or no PDF loaded
  const isVisible = store.sidebarOpen && store.pdfDoc

  return (
    <div
      className={`
        w-56 h-full flex flex-col
        border-r ${tw.border}
        ${tw.bg.tertiary}
        transition-transform duration-200
        ${isVisible ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        flexShrink: 0,
        marginLeft: isVisible ? 0 : -224, // -w-56 in pixels
      }}
    >
      {/* Content area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: 'thin',
          display: store.sidebarView === 'thumbnails' ? 'block' : 'none',
        }}
      >
        <div className="py-2">
          {pages.map((pageNum) => {
            const dims = thumbnailDimensions.get(pageNum)
            return (
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
                  preCalculatedDimensions={dims}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div
        style={{
          display: store.sidebarView === 'outline' ? 'flex' : 'none',
        }}
        className="flex-1 flex-col overflow-hidden"
      >
        <Outline />
      </div>

      {/* View mode toggle buttons */}
      <div
        className={`
          flex border-t ${tw.border}
          ${tw.bg.primary}
        `}
      >
        <button
          onClick={() => store.setSidebarView('thumbnails')}
          className={`
            flex-1 flex items-center justify-center py-2 px-3
            transition-colors ${tw.hover.both}
            ${
              store.sidebarView === 'thumbnails'
                ? tw.primary.text
                : tw.text.both.secondary
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
            transition-colors ${tw.hover.both}
            ${
              store.sidebarView === 'outline'
                ? tw.primary.text
                : tw.text.both.secondary
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
