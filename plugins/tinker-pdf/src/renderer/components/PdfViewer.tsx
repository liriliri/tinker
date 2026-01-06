import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import store from '../store'
import { tw } from 'share/theme'

export default observer(function PdfViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<any>(null)

  useEffect(() => {
    const render = async () => {
      if (!store.pdfDoc || !canvasRef.current) return

      // Cancel previous render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }

      try {
        const page = await store.pdfDoc.getPage(store.currentPage)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context) return

        const viewport = page.getViewport({ scale: store.scale })

        // Set canvas dimensions
        canvas.height = viewport.height
        canvas.width = viewport.width

        // Clear canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height)

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        // Start new render task
        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise
        renderTaskRef.current = null
      } catch (error: any) {
        // Ignore cancellation errors
        if (error?.name === 'RenderingCancelledException') {
          return
        }
        console.error('Error rendering page:', error)
        store.showError('Failed to render PDF page')
      }
    }

    render()
  }, [store.pdfDoc, store.currentPage, store.scale])

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
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`text-center ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
        >
          <p>No PDF loaded</p>
          <p className="text-xs mt-2">Click "Open File" to load a PDF</p>
        </div>
      </div>
    )
  }

  if (store.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`text-center ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
        >
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex-1 overflow-auto ${tw.bg.light.secondary} ${tw.bg.dark.secondary}`}
    >
      <div className="min-h-full flex items-start justify-center p-4">
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>
    </div>
  )
})
