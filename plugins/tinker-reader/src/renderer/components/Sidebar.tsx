import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { LayoutGrid, List } from 'lucide-react'
import { Thumbnail, Outline } from 'share/components/PdfViewer'
import store from '../store'

const THUMBNAIL_WIDTH = 126

interface ThumbnailDimensions {
  width: number
  height: number
}

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [thumbnailDimensions, setThumbnailDimensions] = useState<
    Map<number, ThumbnailDimensions>
  >(new Map())
  const [pdfDocVersion, setPdfDocVersion] = useState(0)
  const prevPdfDocRef = useRef(store.pdfDoc)

  useEffect(() => {
    if (store.pdfDoc !== prevPdfDocRef.current) {
      prevPdfDocRef.current = store.pdfDoc
      setPdfDocVersion((v) => v + 1)
      thumbnailRefs.current.clear()
    }

    if (!store.pdfDoc) {
      setThumbnailDimensions(new Map())
      return
    }

    const initializeDimensions = async () => {
      const dimensions = new Map<number, ThumbnailDimensions>()

      try {
        if (!store.pdfDoc) return

        const firstPage = await store.pdfDoc.getPage(1)
        const viewport = firstPage.getViewport({ scale: 1 })

        const ratio = viewport.width / viewport.height
        const width = THUMBNAIL_WIDTH
        const height = (width / ratio) | 0

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

    requestAnimationFrame(() => {
      const thumbnailRect = thumbnailDiv.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      if (thumbnailRect.height === 0 || containerRect.height === 0) return

      const isVisible =
        thumbnailRect.top >= containerRect.top &&
        thumbnailRect.bottom <= containerRect.bottom

      if (!isVisible) {
        thumbnailDiv.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
        })
      }
    })
  }, [store.currentPage, store.pdfDoc, store.sidebarView, store.sidebarOpen])

  const handleThumbnailClick = (pageNum: number) => {
    store.setCurrentPage(pageNum)
    store.scrollToPage = pageNum
  }

  const pages = store.pdfDoc ? store.pages : []

  const isVisible = store.sidebarOpen && !!store.pdfDoc

  return (
    <div
      className={`w-56 h-full flex flex-col border-r ${tw.border} ${tw.bg.tertiary}`}
      style={{
        flexShrink: 0,
        display: isVisible ? 'flex' : 'none',
      }}
    >
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          display: store.sidebarView === 'thumbnails' ? 'block' : 'none',
        }}
      >
        <div className="py-2">
          {pages.map((pageNum) => {
            const dims = thumbnailDimensions.get(pageNum)
            return (
              <div
                key={`${pdfDocVersion}-${pageNum}`}
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
        className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden"
      >
        <Outline
          pdfDoc={store.pdfDoc}
          numPages={store.numPages}
          onSetCurrentPage={(page) => store.setCurrentPage(page)}
          onSetScrollToPage={(page) => {
            store.scrollToPage = page
          }}
        />
      </div>

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
            transition-colors ${tw.hover}
            ${
              store.sidebarView === 'thumbnails'
                ? tw.primary.text
                : tw.text.secondary
            }
          `}
          title={t('thumbnails')}
        >
          <LayoutGrid size={16} />
        </button>
        <button
          onClick={() => store.setSidebarView('outline')}
          className={`
            flex-1 flex items-center justify-center py-2 px-3
            transition-colors ${tw.hover}
            ${
              store.sidebarView === 'outline'
                ? tw.primary.text
                : tw.text.secondary
            }
          `}
          title={t('outline')}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  )
})
