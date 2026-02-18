import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from 'share/theme'
import FileOpen from 'share/components/FileOpen'

interface PageRenderState {
  rendered: boolean
  rendering: boolean
  width: number
  height: number
}

export default observer(function PdfViewer() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderTasksRef = useRef<Map<number, any>>(new Map())
  const [pageStates, setPageStates] = useState<Map<number, PageRenderState>>(
    new Map()
  )
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Initialize page states when document loads
  useEffect(() => {
    if (!store.pdfDoc) {
      setPageStates(new Map())
      renderTasksRef.current.clear()
      return
    }

    // Pre-calculate dimensions for all pages
    const initializePageStates = async () => {
      const states = new Map<number, PageRenderState>()

      // Get the first page to determine default viewport
      const firstPage = await store.pdfDoc!.getPage(1)
      const viewport = firstPage.getViewport({ scale: store.scale })

      // Assume all pages have the same size (common case)
      // If pages have different sizes, they'll update when rendered
      for (let i = 1; i <= store.numPages; i++) {
        states.set(i, {
          rendered: false,
          rendering: false,
          width: viewport.width,
          height: viewport.height,
        })
      }

      setPageStates(states)
    }

    initializePageStates()
  }, [store.pdfDoc, store.numPages])

  // Auto-fit width on initial load only
  useEffect(() => {
    if (!store.pdfDoc || !containerRef.current || store.userHasZoomed) return

    const adjustScale = async () => {
      try {
        // Get the first page to determine dimensions
        const page = await store.pdfDoc!.getPage(1)
        const viewport = page.getViewport({ scale: 1.0 })
        const pageWidth = viewport.width

        // Get container width (minus padding)
        const container = containerRef.current!
        const containerWidth = container.clientWidth
        const availableWidth = containerWidth - 32 // Account for padding (16px * 2)

        // If page is wider than container, scale it down to fit (initial load only)
        if (pageWidth * store.scale > availableWidth) {
          const fitScale = availableWidth / pageWidth
          // Round to 2 decimal places
          const adjustedScale = Math.round(fitScale * 100) / 100
          store.setScale(adjustedScale, false) // Not a user action
        }

        // Store container width for future reference
        store.setContainerWidth(containerWidth)
      } catch (error) {
        console.error('Error adjusting scale:', error)
      }
    }

    adjustScale()
  }, [store.pdfDoc])

  // Track container width changes (but don't auto-adjust scale after user has zoomed)
  useEffect(() => {
    if (!containerRef.current) return

    let resizeTimeout: NodeJS.Timeout

    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout)

      resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          const containerWidth = entry.contentRect.width
          store.setContainerWidth(containerWidth)
        }
      }, 100)
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
    }
  }, [])

  // Render a specific page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!store.pdfDoc) return

      const canvas = canvasRefs.current.get(pageNum)
      if (!canvas) return

      const state = pageStates.get(pageNum)
      if (!state || state.rendering || state.rendered) return

      // Update state to rendering and update dimensions
      setPageStates((prev) => {
        const next = new Map(prev)
        const pageState = next.get(pageNum)
        if (pageState) {
          pageState.rendering = true
        }
        return next
      })

      try {
        const page = await store.pdfDoc.getPage(pageNum)
        const context = canvas.getContext('2d')

        if (!context) return

        const viewport = page.getViewport({ scale: store.scale })

        // Get device pixel ratio for high DPI displays
        const outputScale = window.devicePixelRatio || 1

        // Update dimensions in state first (before rendering)
        setPageStates((prev) => {
          const next = new Map(prev)
          const pageState = next.get(pageNum)
          if (pageState) {
            pageState.width = viewport.width
            pageState.height = viewport.height
          }
          return next
        })

        // Set canvas dimensions with device pixel ratio
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        // Scale the context to match device pixel ratio
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0)

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }

        // Start render task
        const renderTask = page.render(renderContext)
        renderTasksRef.current.set(pageNum, renderTask)

        await renderTask.promise

        renderTasksRef.current.delete(pageNum)

        // Mark as rendered
        setPageStates((prev) => {
          const next = new Map(prev)
          const pageState = next.get(pageNum)
          if (pageState) {
            pageState.rendering = false
            pageState.rendered = true
          }
          return next
        })
      } catch (error: any) {
        renderTasksRef.current.delete(pageNum)

        // Ignore cancellation errors
        if (error?.name === 'RenderingCancelledException') {
          setPageStates((prev) => {
            const next = new Map(prev)
            const pageState = next.get(pageNum)
            if (pageState) {
              pageState.rendering = false
            }
            return next
          })
          return
        }
        console.error(`Error rendering page ${pageNum}:`, error)
        setPageStates((prev) => {
          const next = new Map(prev)
          const pageState = next.get(pageNum)
          if (pageState) {
            pageState.rendering = false
          }
          return next
        })
      }
    },
    [store.pdfDoc, store.scale, pageStates]
  )

  // Re-render all visible pages when scale changes
  useEffect(() => {
    if (!store.pdfDoc) return

    // Cancel all render tasks
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel()
      } catch {
        // Ignore errors
      }
    })
    renderTasksRef.current.clear()

    // Update dimensions and reset render states
    const updateDimensionsAndReset = async () => {
      // Get the first page to calculate new dimensions
      const firstPage = await store.pdfDoc!.getPage(1)
      const viewport = firstPage.getViewport({ scale: store.scale })

      setPageStates((prev) => {
        const next = new Map(prev)
        next.forEach((state) => {
          state.rendered = false
          state.rendering = false
          // Update dimensions for new scale
          state.width = viewport.width
          state.height = viewport.height
        })
        return next
      })
    }

    updateDimensionsAndReset()

    // Clear all canvases and reset their dimensions
    canvasRefs.current.forEach((canvas) => {
      const context = canvas.getContext('2d')
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
      }
      // Reset canvas dimensions to trigger layout recalculation
      canvas.width = 0
      canvas.height = 0
    })
  }, [store.scale])

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (!store.pdfDoc) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(
              entry.target.getAttribute('data-page-number') || '0',
              10
            )
            if (pageNum > 0) {
              renderPage(pageNum)
            }
          }
        })
      },
      {
        root: containerRef.current,
        rootMargin: '200px',
        threshold: 0.01,
      }
    )

    observerRef.current = observer

    // Observe all page elements
    pageRefs.current.forEach((pageDiv) => {
      observer.observe(pageDiv)
    })

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [store.pdfDoc, store.numPages, renderPage])

  // Track current page based on scroll position
  useEffect(() => {
    if (!store.pdfDoc || !containerRef.current) return

    let ticking = false

    const handleScroll = () => {
      if (ticking) return

      ticking = true
      requestAnimationFrame(() => {
        const container = containerRef.current
        if (!container) {
          ticking = false
          return
        }

        // Find the page that is most visible in the viewport
        let mostVisiblePage = 1
        let maxVisibility = 0

        pageRefs.current.forEach((pageDiv, pageNum) => {
          const rect = pageDiv.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          // Calculate visible height of the page
          const visibleTop = Math.max(rect.top, containerRect.top)
          const visibleBottom = Math.min(rect.bottom, containerRect.bottom)
          const visibleHeight = Math.max(0, visibleBottom - visibleTop)

          if (visibleHeight > maxVisibility) {
            maxVisibility = visibleHeight
            mostVisiblePage = pageNum
          }
        })

        if (mostVisiblePage !== store.currentPage) {
          store.setCurrentPage(mostVisiblePage)
        }

        ticking = false
      })
    }

    const container = containerRef.current
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [store.pdfDoc])

  // Scroll to current page when navigation buttons are used
  useEffect(() => {
    if (!store.pdfDoc || !store.scrollToPage) return

    const pageDiv = pageRefs.current.get(store.scrollToPage)
    if (pageDiv) {
      pageDiv.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }, [store.scrollToPage])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!store.pdfDoc) return

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        store.prevPage()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        store.nextPage()
      }
      // + and - for zoom
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        store.zoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        store.zoomOut()
      }
      // 0 to reset zoom
      else if (e.key === '0') {
        e.preventDefault()
        store.resetZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [store.pdfDoc])

  if (!store.pdfDoc) {
    return (
      <FileOpen
        onOpenFile={(file) => store.openFileFromFile(file)}
        openTitle={t('openTitle')}
        fileName={store.fileName}
      />
    )
  }

  if (store.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-center ${tw.text.both.secondary}`}>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const pages = Array.from({ length: store.numPages }, (_, i) => i + 1)

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-auto ${tw.bg.secondary}`}
    >
      <div className="py-4 px-4 flex flex-col items-center gap-4">
        {pages.map((pageNum) => {
          const pageState = pageStates.get(pageNum)
          const width = pageState?.width || 0
          const height = pageState?.height || 200

          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) {
                  pageRefs.current.set(pageNum, el)
                } else {
                  pageRefs.current.delete(pageNum)
                }
              }}
              data-page-number={pageNum}
              className="relative bg-white shadow-lg"
              style={{
                width: width > 0 ? `${width}px` : 'auto',
                height: height > 0 ? `${height}px` : 'auto',
                minHeight: '200px',
              }}
            >
              <canvas
                ref={(el) => {
                  if (el) {
                    canvasRefs.current.set(pageNum, el)
                  } else {
                    canvasRefs.current.delete(pageNum)
                  }
                }}
                className="block"
              />
              {!pageState?.rendered && !pageState?.rendering && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p>Page {pageNum}</p>
                </div>
              )}
              {pageState?.rendering && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p>Rendering...</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
