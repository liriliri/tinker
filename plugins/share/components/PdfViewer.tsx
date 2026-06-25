import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { tw } from '../theme'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'pdfViewer'

addI18nNamespace(I18N_NS, {
  'en-US': {
    loading: 'Loading...',
    error: 'Failed to load PDF',
    page: 'Page {{pageNum}}',
    rendering: 'Rendering...',
  },
  'zh-CN': {
    loading: '加载中...',
    error: '无法加载 PDF',
    page: '第 {{pageNum}} 页',
    rendering: '渲染中...',
  },
})

interface PageRenderState {
  rendered: boolean
  rendering: boolean
  width: number
  height: number
}

export interface PdfViewerProps {
  /** Load PDF from disk when pdfDoc is not supplied */
  filePath?: string
  /** Pre-loaded document for controlled usage */
  pdfDoc?: PDFDocumentProxy | null
  loading?: boolean
  empty?: ReactNode
  onLoadError?: () => void
  scale?: number
  onScaleChange?: (scale: number, isUserAction?: boolean) => void
  userHasZoomed?: boolean
  currentPage?: number
  onCurrentPageChange?: (page: number) => void
  scrollToPage?: number
  enableKeyboardShortcuts?: boolean
  onPrevPage?: () => void
  onNextPage?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetZoom?: () => void
  onContainerWidthChange?: (width: number) => void
  className?: string
}

export default function PdfViewer({
  filePath,
  pdfDoc: pdfDocProp,
  loading: loadingProp = false,
  empty,
  onLoadError,
  scale: scaleProp,
  onScaleChange,
  userHasZoomed = false,
  onCurrentPageChange,
  scrollToPage = 0,
  enableKeyboardShortcuts = false,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onContainerWidthChange,
  className = 'h-full',
}: PdfViewerProps) {
  const { t } = useTranslation(I18N_NS)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map())
  const [loadedDoc, setLoadedDoc] = useState<PDFDocumentProxy | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState(false)
  const [internalScale, setInternalScale] = useState(1)
  const [pageStates, setPageStates] = useState<Map<number, PageRenderState>>(
    new Map()
  )

  const usesExternalDoc = pdfDocProp !== undefined
  const pdfDoc = usesExternalDoc ? pdfDocProp : loadedDoc
  const numPages = pdfDoc?.numPages ?? 0
  const isControlledScale = scaleProp !== undefined
  const scale = isControlledScale ? scaleProp! : internalScale
  const loading = loadingProp || fileLoading

  const setScale = useCallback(
    (nextScale: number, isUserAction = false) => {
      const rounded = Math.round(nextScale * 100) / 100
      if (isControlledScale) {
        onScaleChange?.(rounded, isUserAction)
      } else {
        setInternalScale(rounded)
      }
    },
    [isControlledScale, onScaleChange]
  )

  useEffect(() => {
    if (usesExternalDoc || !filePath) return

    let cancelled = false
    let doc: PDFDocumentProxy | null = null

    const load = async () => {
      setFileLoading(true)
      setFileError(false)
      setLoadedDoc(null)
      setPageStates(new Map())
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel()
        } catch {
          // ignore
        }
      })
      renderTasksRef.current.clear()

      try {
        const data = await tinker.readFile(filePath)
        if (cancelled) return

        doc = await pdfjsLib.getDocument({ data }).promise
        if (cancelled) {
          void doc.destroy()
          return
        }

        setLoadedDoc(doc)
      } catch (err) {
        console.error('Failed to load PDF:', err)
        if (!cancelled) {
          setFileError(true)
          onLoadError?.()
        }
      } finally {
        if (!cancelled) setFileLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel()
        } catch {
          // ignore
        }
      })
      renderTasksRef.current.clear()
      if (doc) void doc.destroy()
    }
  }, [filePath, usesExternalDoc, onLoadError])

  useEffect(() => {
    if (!pdfDoc) {
      setPageStates(new Map())
      renderTasksRef.current.clear()
      return
    }

    let cancelled = false

    const initializePageStates = async () => {
      const firstPage = await pdfDoc.getPage(1)
      if (cancelled) return

      const viewport = firstPage.getViewport({ scale })
      const states = new Map<number, PageRenderState>()
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        states.set(i, {
          rendered: false,
          rendering: false,
          width: viewport.width,
          height: viewport.height,
        })
      }
      setPageStates(states)
    }

    void initializePageStates()

    return () => {
      cancelled = true
    }
  }, [pdfDoc, numPages])

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return
    if (usesExternalDoc && userHasZoomed) return

    let cancelled = false

    const adjustScale = async () => {
      try {
        const page = await pdfDoc.getPage(1)
        if (cancelled) return

        const viewport = page.getViewport({ scale: 1 })
        const containerWidth = containerRef.current!.clientWidth
        const availableWidth = Math.max(containerWidth - 32, 1)
        const fitScale = availableWidth / viewport.width
        const maxScale = usesExternalDoc ? 3 : 2
        const nextScale = Math.min(fitScale, maxScale)

        if (usesExternalDoc) {
          if (viewport.width * scale > availableWidth) {
            setScale(nextScale, false)
          }
          onContainerWidthChange?.(containerWidth)
        } else {
          setScale(nextScale, false)
        }
      } catch (err) {
        console.error('Failed to adjust PDF scale:', err)
      }
    }

    void adjustScale()

    const observer = new ResizeObserver(() => {
      void adjustScale()
    })
    observer.observe(containerRef.current)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [pdfDoc, userHasZoomed, usesExternalDoc, setScale, onContainerWidthChange])

  useEffect(() => {
    if (!containerRef.current || !onContainerWidthChange) return

    let resizeTimeout: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          onContainerWidthChange(entry.contentRect.width)
        }
      }, 100)
    })

    observer.observe(containerRef.current)

    return () => {
      clearMs(resizeTimeout)
      observer.disconnect()
    }
  }, [onContainerWidthChange])

  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc) return

      const canvas = canvasRefs.current.get(pageNum)
      if (!canvas) return

      const state = pageStates.get(pageNum)
      if (!state || state.rendering || state.rendered) return

      setPageStates((prev) => {
        const next = new Map(prev)
        const pageState = next.get(pageNum)
        if (pageState) pageState.rendering = true
        return next
      })

      try {
        const page = await pdfDoc.getPage(pageNum)
        const context = canvas.getContext('2d')
        if (!context) return

        const viewport = page.getViewport({ scale })
        const outputScale = window.devicePixelRatio || 1

        setPageStates((prev) => {
          const next = new Map(prev)
          const pageState = next.get(pageNum)
          if (pageState) {
            pageState.width = viewport.width
            pageState.height = viewport.height
          }
          return next
        })

        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0)

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          canvas,
        })
        renderTasksRef.current.set(pageNum, renderTask)
        await renderTask.promise
        renderTasksRef.current.delete(pageNum)

        setPageStates((prev) => {
          const next = new Map(prev)
          const pageState = next.get(pageNum)
          if (pageState) {
            pageState.rendering = false
            pageState.rendered = true
          }
          return next
        })
      } catch (err: unknown) {
        renderTasksRef.current.delete(pageNum)
        if (
          (err as { name?: string })?.name === 'RenderingCancelledException'
        ) {
          setPageStates((prev) => {
            const next = new Map(prev)
            const pageState = next.get(pageNum)
            if (pageState) pageState.rendering = false
            return next
          })
          return
        }
        console.error(`Failed to render PDF page ${pageNum}:`, err)
        setPageStates((prev) => {
          const next = new Map(prev)
          const pageState = next.get(pageNum)
          if (pageState) pageState.rendering = false
          return next
        })
      }
    },
    [pdfDoc, pageStates, scale]
  )

  useEffect(() => {
    if (!pdfDoc) return

    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel()
      } catch {
        // ignore
      }
    })
    renderTasksRef.current.clear()

    let cancelled = false

    const resetPages = async () => {
      const firstPage = await pdfDoc.getPage(1)
      if (cancelled) return

      const viewport = firstPage.getViewport({ scale })
      setPageStates((prev) => {
        const next = new Map(prev)
        next.forEach((state) => {
          state.rendered = false
          state.rendering = false
          state.width = viewport.width
          state.height = viewport.height
        })
        return next
      })
    }

    void resetPages()

    canvasRefs.current.forEach((canvas) => {
      const context = canvas.getContext('2d')
      if (context) context.clearRect(0, 0, canvas.width, canvas.height)
      canvas.width = 0
      canvas.height = 0
    })

    return () => {
      cancelled = true
    }
  }, [pdfDoc, scale])

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const pageNum = parseInt(
            entry.target.getAttribute('data-page-number') || '0',
            10
          )
          if (pageNum > 0) void renderPage(pageNum)
        })
      },
      {
        root: containerRef.current,
        rootMargin: '200px',
        threshold: 0.01,
      }
    )

    pageRefs.current.forEach((pageDiv) => observer.observe(pageDiv))

    return () => observer.disconnect()
  }, [pdfDoc, numPages, pageStates, renderPage])

  useEffect(() => {
    if (!pdfDoc || !containerRef.current || !onCurrentPageChange) return

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

        let mostVisiblePage = 1
        let maxVisibility = 0

        pageRefs.current.forEach((pageDiv, pageNum) => {
          const rect = pageDiv.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const visibleTop = Math.max(rect.top, containerRect.top)
          const visibleBottom = Math.min(rect.bottom, containerRect.bottom)
          const visibleHeight = Math.max(0, visibleBottom - visibleTop)

          if (visibleHeight > maxVisibility) {
            maxVisibility = visibleHeight
            mostVisiblePage = pageNum
          }
        })

        onCurrentPageChange(mostVisiblePage)
        ticking = false
      })
    }

    const container = containerRef.current
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => container.removeEventListener('scroll', handleScroll)
  }, [pdfDoc, onCurrentPageChange])

  useEffect(() => {
    if (!pdfDoc || !scrollToPage) return

    const pageDiv = pageRefs.current.get(scrollToPage)
    pageDiv?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [pdfDoc, scrollToPage])

  useEffect(() => {
    if (!enableKeyboardShortcuts || !pdfDoc) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        onPrevPage?.()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        onNextPage?.()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        onZoomIn?.()
      } else if (e.key === '-') {
        e.preventDefault()
        onZoomOut?.()
      } else if (e.key === '0') {
        e.preventDefault()
        onResetZoom?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enableKeyboardShortcuts,
    pdfDoc,
    onPrevPage,
    onNextPage,
    onZoomIn,
    onZoomOut,
    onResetZoom,
  ])

  if (!pdfDoc) {
    if (loading) {
      return (
        <div
          className={`flex items-center justify-center ${className} ${tw.text.secondary}`}
        >
          {t('loading')}
        </div>
      )
    }

    if (fileError) {
      return (
        <div
          className={`flex items-center justify-center ${className} ${tw.text.secondary}`}
        >
          {t('error')}
        </div>
      )
    }

    if (empty) return <>{empty}</>

    return null
  }

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className} ${tw.text.secondary}`}
      >
        {t('loading')}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${tw.bg.secondary} ${className}`}
    >
      <div className="py-4 px-4 flex flex-col items-center gap-4">
        {Array.from({ length: numPages }, (_, index) => {
          const pageNum = index + 1
          const pageState = pageStates.get(pageNum)
          const width = pageState?.width || 0
          const height = pageState?.height || 200

          return (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el)
                else pageRefs.current.delete(pageNum)
              }}
              data-page-number={pageNum}
              className={`relative ${tw.bg.primary} shadow-lg`}
              style={{
                width: width > 0 ? `${width}px` : 'auto',
                height: height > 0 ? `${height}px` : 'auto',
                minHeight: '200px',
              }}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el)
                  else canvasRefs.current.delete(pageNum)
                }}
                className={`block ${tw.bg.primary}`}
              />
              {!pageState?.rendered && !pageState?.rendering && (
                <div
                  className={`absolute inset-0 flex items-center justify-center ${tw.text.tertiary}`}
                >
                  {t('page', { pageNum })}
                </div>
              )}
              {pageState?.rendering && (
                <div
                  className={`absolute inset-0 flex items-center justify-center ${tw.text.tertiary}`}
                >
                  {t('rendering')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function clearMs(timeout: ReturnType<typeof setTimeout> | undefined) {
  if (timeout) clearTimeout(timeout)
}
