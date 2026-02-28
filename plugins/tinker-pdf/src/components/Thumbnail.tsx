import { useEffect, useRef, useState } from 'react'
import { tw, THEME_COLORS } from 'share/theme'
import className from 'licia/className'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { THUMBNAIL_WIDTH } from '../lib/constants'

interface ThumbnailProps {
  pageNum: number
  pdfDoc: PDFDocumentProxy | null
  scale: number
  isActive: boolean
  onClick: () => void
  preCalculatedDimensions?: { width: number; height: number }
}

export default function Thumbnail({
  pageNum,
  pdfDoc,
  isActive,
  onClick,
  preCalculatedDimensions,
}: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [dimensions, setDimensions] = useState(
    preCalculatedDimensions || { width: THUMBNAIL_WIDTH, height: 100 }
  )
  const renderTaskRef = useRef<RenderTask | null>(null)

  useEffect(() => {
    if (preCalculatedDimensions) {
      setDimensions(preCalculatedDimensions)
    }
  }, [preCalculatedDimensions])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0,
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!pdfDoc || !canvasRef.current || rendered || rendering || !isVisible)
        return

      setRendering(true)

      try {
        const page: PDFPageProxy = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1 })

        const ratio = viewport.width / viewport.height
        const canvasWidth = THUMBNAIL_WIDTH
        const canvasHeight = (canvasWidth / ratio) | 0
        const thumbnailScale = canvasWidth / viewport.width

        setDimensions({ width: canvasWidth, height: canvasHeight })

        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: false,
        })
        if (!context) return

        // Render at 2x scale for better quality, then downscale
        const upscaleFactor = 2
        const scaledViewport = page.getViewport({
          scale: thumbnailScale * upscaleFactor,
        })

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        canvas.style.width = `${canvasWidth}px`
        canvas.style.height = `${canvasHeight}px`

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        }

        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise

        setRendered(true)
      } catch (error: unknown) {
        if (
          (error as { name?: string })?.name !== 'RenderingCancelledException'
        ) {
          console.error(`Error rendering thumbnail ${pageNum}:`, error)
        }
      } finally {
        setRendering(false)
        renderTaskRef.current = null
      }
    }

    renderThumbnail()

    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // Ignore
        }
      }
    }
  }, [pdfDoc, pageNum, isVisible])

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center p-2 cursor-pointer rounded relative"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Page ${pageNum}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={className(
          `relative ${tw.bg.primary} overflow-hidden rounded-lg transition-shadow`
        )}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          minHeight: dimensions.height,
          boxShadow: isActive
            ? `0 0 0 2px ${THEME_COLORS.primary}`
            : `0 0.375px 1.5px 0 rgba(0,0,0,0.05), 0 0 0 1px ${THEME_COLORS.border.light}, 0 3px 12px 0 rgba(0,0,0,0.1)`,
        }}
      >
        <canvas
          ref={canvasRef}
          className={`block ${tw.bg.primary}`}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
        {!rendered && !rendering && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${tw.bg.primary} ${tw.text.tertiary} text-xs`}
          >
            <p>{pageNum}</p>
          </div>
        )}
        {rendering && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${tw.bg.primary} ${tw.text.tertiary} text-xs`}
          >
            <p>...</p>
          </div>
        )}
      </div>
      {/* Page number overlay */}
      <div
        className={`
          absolute bottom-3 left-1/2 -translate-x-1/2
          min-w-[32px] h-4 px-2
          flex items-center justify-center
          rounded-lg text-xs font-normal
          pointer-events-none
          ${tw.bg.primary}
          ${tw.text.primary}
        `}
      >
        {pageNum}
      </div>
    </div>
  )
}
