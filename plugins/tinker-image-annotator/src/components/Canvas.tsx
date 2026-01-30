import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import {
  App,
  Frame,
  Rect,
  Ellipse,
  Line,
  Text,
  DragEvent,
  PointerEvent,
  ZoomEvent,
  ResizeEvent,
} from 'leafer-ui'
import { ScrollBar } from '@leafer-in/scroll'
import '@leafer-in/editor'
import '@leafer-in/export'
import '@leafer-in/scroll'
import '@leafer-in/text-editor'
import '@leafer-in/viewport'
import '@leafer-in/view'
import store from '../store'
import i18n from '../i18n'
import { THEME_COLORS } from 'share/theme'

type LeaferPointEvent = {
  getPage?: () => { x: number; y: number }
  x?: number
  y?: number
}

const getPoint = (event: unknown) => {
  if (event && typeof event === 'object') {
    const pointEvent = event as LeaferPointEvent
    if (typeof pointEvent.getPage === 'function') {
      return pointEvent.getPage()
    }
    if (typeof pointEvent.x === 'number' && typeof pointEvent.y === 'number') {
      return { x: pointEvent.x, y: pointEvent.y }
    }
  }
  return { x: 0, y: 0 }
}

const getArrowPoints = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  strokeWidth: number
) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)
  if (distance < 0.001) {
    return [start.x, start.y, end.x, end.y]
  }

  const headLength = Math.max(8, strokeWidth * 3)
  const angle = Math.atan2(dy, dx)
  const headAngle = Math.PI / 6
  const left = {
    x: end.x - headLength * Math.cos(angle - headAngle),
    y: end.y - headLength * Math.sin(angle - headAngle),
  }
  const right = {
    x: end.x - headLength * Math.cos(angle + headAngle),
    y: end.y - headLength * Math.sin(angle + headAngle),
  }

  return [
    start.x,
    start.y,
    end.x,
    end.y,
    left.x,
    left.y,
    end.x,
    end.y,
    right.x,
    right.y,
  ]
}

const Canvas = observer(() => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = containerRef.current
    if (!target) return

    const app = new App({
      view: target,
      editor: {
        lockRatio: 'corner',
        stroke: THEME_COLORS.primary,
        skewable: false,
        hover: false,
      },
      move: {
        drag: false,
      },
      tree: { usePartRender: true, type: 'design' },
      sky: { type: 'draw', usePartRender: true },
    })

    new ScrollBar(app)
    store.setApp(app)
    store.syncEditorMode()

    const updateTextSelection = () => {
      const editor = app.editor
      if (!editor) return
      const selectedText = editor.list.find((item) => item instanceof Text)
      store.setTextSelected(!!selectedText)
      if (selectedText && typeof selectedText.fontSize === 'number') {
        store.setFontSize(selectedText.fontSize)
      }
    }

    const handleInnerEditorOpen = () => {
      const target = app.editor?.innerEditor?.editTarget
      const isTextEditing = target instanceof Text
      store.setTextEditing(isTextEditing)
      if (isTextEditing && typeof target.fontSize === 'number') {
        store.setFontSize(target.fontSize)
      }
    }

    const handleInnerEditorClose = () => {
      store.setTextEditing(false)
    }

    const updateScale = () => {
      const scaleValue = app.tree.scale
      const nextScale =
        typeof scaleValue === 'number' ? scaleValue : scaleValue?.x ?? 1
      store.setScale(nextScale)
    }

    const handleResize = () => {
      if (store.image) {
        app.tree.zoom('fit', 100)
      }
      updateScale()
    }

    app.tree.on(ZoomEvent.ZOOM, updateScale)
    app.tree.on(ResizeEvent.RESIZE, handleResize)
    app.editor?.on('editor.select', updateTextSelection)
    app.editor?.on('innerEditor.open', handleInnerEditorOpen)
    app.editor?.on('innerEditor.close', handleInnerEditorClose)
    updateTextSelection()

    return () => {
      app.tree.off(ZoomEvent.ZOOM, updateScale)
      app.tree.off(ResizeEvent.RESIZE, handleResize)
      app.editor?.off('editor.select', updateTextSelection)
      app.editor?.off('innerEditor.open', handleInnerEditorOpen)
      app.editor?.off('innerEditor.close', handleInnerEditorClose)
      store.setFrame(null)
      store.setTextSelected(false)
      store.setTextEditing(false)
      app.destroy(true)
      store.setApp(null)
    }
  }, [])

  useEffect(() => {
    const app = store.app
    if (!app) return

    app.tree.children.forEach((child) => child.remove())
    store.setFrame(null)
    if (!store.image) {
      app.tree.zoom(1)
      const scaleValue = app.tree.scale
      const nextScale =
        typeof scaleValue === 'number' ? scaleValue : scaleValue?.x ?? 1
      store.setScale(nextScale)
      return
    }

    const frame = new Frame({
      id: 'image-frame',
      width: store.image.width,
      height: store.image.height,
      overflow: 'hide',
    })

    const image = new Rect({
      id: 'base-image',
      width: store.image.width,
      height: store.image.height,
      fill: {
        type: 'image',
        url: store.image.url,
        mode: 'fit',
      },
      editable: false,
    })

    app.tree.add(frame)
    frame.add(image)
    store.setFrame(frame)
    app.tree.zoom('fit', 100)
    const scaleValue = app.tree.scale
    const nextScale =
      typeof scaleValue === 'number' ? scaleValue : scaleValue?.x ?? 1
    store.setScale(nextScale)
  }, [store.app, store.image])

  useEffect(() => {
    const app = store.app
    if (!app) return

    let drawing: Rect | Ellipse | Line | Text | null = null
    let startPoint: { x: number; y: number } | null = null

    const createLine = (point: { x: number; y: number }, curve: boolean) => {
      return new Line({
        points: [point.x, point.y, point.x, point.y],
        stroke: store.foregroundColor,
        strokeWidth: store.strokeWidth,
        strokeCap: 'round',
        strokeJoin: 'round',
        curve,
        editable: true,
      })
    }

    const createArrow = (point: { x: number; y: number }) => {
      return new Line({
        points: getArrowPoints(point, point, store.strokeWidth),
        stroke: store.foregroundColor,
        strokeWidth: store.strokeWidth,
        strokeCap: 'round',
        strokeJoin: 'round',
        editable: true,
      })
    }

    const onPointerDown = (event: unknown) => {
      if (store.tool !== 'text') return
      if (!store.image) return
      const parent = store.frame ?? app.tree

      const point = getPoint(event)
      const text = new Text({
        text: i18n.t('textPlaceholder') as string,
        x: point.x,
        y: point.y,
        fill: store.foregroundColor,
        fontSize: store.fontSize,
        editable: true,
      })

      parent.add(text)
      app.editor?.select(text)
      app.editor?.openInnerEditor(text, 'TextEditor', true)
      store.setTool('select')
    }

    const onDragStart = (event: unknown) => {
      if (!store.image) return
      if (store.tool === 'select') return
      if (store.tool === 'move') return
      if (store.tool === 'text') return

      startPoint = getPoint(event)

      if (store.tool === 'rect') {
        drawing = new Rect({
          x: startPoint.x,
          y: startPoint.y,
          width: 1,
          height: 1,
          stroke: store.foregroundColor,
          strokeWidth: store.strokeWidth,
          cornerRadius: 6,
          editable: true,
        })
      } else if (store.tool === 'ellipse') {
        drawing = new Ellipse({
          x: startPoint.x,
          y: startPoint.y,
          width: 1,
          height: 1,
          stroke: store.foregroundColor,
          strokeWidth: store.strokeWidth,
          editable: true,
        })
      } else if (store.tool === 'line') {
        drawing = createLine(startPoint, false)
      } else if (store.tool === 'arrow') {
        drawing = createArrow(startPoint)
      } else if (store.tool === 'pen') {
        drawing = createLine(startPoint, true)
      }

      if (drawing) {
        const parent = store.frame ?? app.tree
        parent.add(drawing)
      }
    }

    const onDrag = (event: unknown) => {
      if (!drawing || !startPoint) return

      const point = getPoint(event)

      if (drawing instanceof Rect || drawing instanceof Ellipse) {
        const x = Math.min(startPoint.x, point.x)
        const y = Math.min(startPoint.y, point.y)
        const width = Math.max(1, Math.abs(point.x - startPoint.x))
        const height = Math.max(1, Math.abs(point.y - startPoint.y))

        drawing.x = x
        drawing.y = y
        drawing.width = width
        drawing.height = height
      } else if (drawing instanceof Line) {
        if (store.tool === 'pen') {
          const points = drawing.points as number[]
          drawing.points = [...points, point.x, point.y]
        } else if (store.tool === 'arrow') {
          drawing.points = getArrowPoints(startPoint, point, store.strokeWidth)
        } else {
          drawing.points = [startPoint.x, startPoint.y, point.x, point.y]
        }
      }
    }

    const onDragEnd = () => {
      drawing = null
      startPoint = null
    }

    app.tree.on(PointerEvent.DOWN, onPointerDown)
    app.tree.on(DragEvent.START, onDragStart)
    app.tree.on(DragEvent.DRAG, onDrag)
    app.tree.on(DragEvent.END, onDragEnd)

    return () => {
      app.tree.off(PointerEvent.DOWN, onPointerDown)
      app.tree.off(DragEvent.START, onDragStart)
      app.tree.off(DragEvent.DRAG, onDrag)
      app.tree.off(DragEvent.END, onDragEnd)
    }
  }, [
    store.app,
    store.tool,
    store.foregroundColor,
    store.strokeWidth,
    store.fontSize,
    store.image,
  ])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
})

export default Canvas
