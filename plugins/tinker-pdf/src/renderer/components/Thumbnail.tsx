import { useEffect, useRef, useState } from 'react'
import { tw } from 'share/theme'
import type { PDFPageProxy } from 'pdfjs-dist'

const THUMBNAIL_WIDTH = 126

interface ThumbnailProps {
  pageNum: number
  pdfDoc: any
  scale: number
  isActive: boolean
  onClick: () => void
}

export default function Thumbnail({
  pageNum,
  pdfDoc,
  isActive,
  onClick,
}: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const renderTaskRef = useRef<any>(null)

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!pdfDoc || !canvasRef.current || rendered || rendering) return

      setRendering(true)

      try {
        const page: PDFPageProxy = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1 })

        // Calculate thumbnail dimensions
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
        }

        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise

        setRendered(true)
      } catch (error: any) {
        if (error?.name !== 'RenderingCancelledException') {
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
  }, [pdfDoc, pageNum])

  return (
    <div
      className={`
        flex flex-col items-center p-2 cursor-pointer rounded transition-colors
        ${isActive ? `${tw.bg.light.active} ${tw.bg.dark.active}` : ''}
        hover:${tw.bg.light.hover} hover:${tw.bg.dark.hover}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Page ${pageNum}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={`
          relative bg-white shadow-md overflow-hidden
          ${isActive ? 'ring-2 ring-blue-500' : ''}
        `}
        style={{
          width: dimensions.width || THUMBNAIL_WIDTH,
          minHeight: dimensions.height || 100,
        }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
        {!rendered && !rendering && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
            <p>{pageNum}</p>
          </div>
        )}
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
            <p>...</p>
          </div>
        )}
      </div>
      <div
        className={`mt-1 text-xs ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
      >
        {pageNum}
      </div>
    </div>
  )
}
