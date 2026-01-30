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
  PropertyEvent,
} from 'leafer-ui'
import { ScrollBar } from '@leafer-in/scroll'
import '@leafer-in/editor'
import '@leafer-in/export'
import '@leafer-in/scroll'
import '@leafer-in/text-editor'
import '@leafer-in/viewport'
import '@leafer-in/view'
import { Snap } from 'leafer-x-easy-snap'
import Magnifier from '../lib/Magnifier'
import Mosaic from '../lib/Mosaic'
import store from '../store'
import i18n from '../i18n'
import { THEME_COLORS } from 'share/theme'
const rotateIconUrl = new URL('../assets/rotate.svg', import.meta.url).href

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
  const watermarkRectRef = useRef<Rect | null>(null)

  useEffect(() => {
    const target = containerRef.current
    if (!target) return

    const app = new App({
      view: target,
      editor: {
        lockRatio: 'corner',
        stroke: THEME_COLORS.primary,
        rotateable: true,
        rotatePoint: {
          width: 16,
          height: 16,
          fill: {
            type: 'image',
            url: rotateIconUrl,
          },
        },
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
    const snap = new Snap(app, {
      attachEvents: ['move', 'scale'],
      lineColor: THEME_COLORS.primary,
      snapSize: 5,
      distanceLabelStyle: {
        text: {
          fill: THEME_COLORS.primary,
        },
      },
    })
    snap.enable(true)

    const updateTextSelection = () => {
      const editor = app.editor
      if (!editor) return
      const selectedText = editor.list.find((item) => item instanceof Text)
      store.setTextSelected(!!selectedText)
      if (selectedText && typeof selectedText.fontSize === 'number') {
        store.setFontSize(selectedText.fontSize)
      }

      const hasMagnifier = editor.list.some((item) => item instanceof Magnifier)
      if (hasMagnifier && editor.list.length > 1) {
        app.editor.config.rotateable = false
        app.editor.config.lockRatio = true
      } else {
        app.editor.config.rotateable = true
        app.editor.config.lockRatio = 'corner'
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
      snap.enable(false)
      if ('destroy' in snap && typeof snap.destroy === 'function') {
        snap.destroy()
      }
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
    store.createSnapshot()
  }, [store.app, store.image])

  useEffect(() => {
    const frame = store.frame
    if (!frame) {
      if (watermarkRectRef.current) {
        watermarkRectRef.current.remove()
        watermarkRectRef.current = null
      }
      return
    }

    if (!store.watermarkSvg) {
      if (watermarkRectRef.current) {
        watermarkRectRef.current.remove()
        watermarkRectRef.current = null
      }
      return
    }

    if (!watermarkRectRef.current) {
      watermarkRectRef.current = new Rect({
        id: 'watermark-layer',
        x: 0,
        y: 0,
        editable: false,
      })
      frame.add(watermarkRectRef.current)
    } else if (watermarkRectRef.current.parent !== frame) {
      frame.add(watermarkRectRef.current)
    }

    const watermarkRect = watermarkRectRef.current
    watermarkRect.width = frame.width
    watermarkRect.height = frame.height
    watermarkRect.zIndex = 1
    watermarkRect.fill = {
      type: 'image',
      url: store.watermarkSvg,
      mode: 'repeat',
      format: 'svg',
      size: Math.round(frame.width / 6),
    }
  }, [store.frame, store.watermarkSvg, store.image?.width, store.image?.height])

  useEffect(() => {
    const app = store.app
    if (!app) return

    let drawing: Rect | Ellipse | Line | Text | Magnifier | Mosaic | null = null
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

      if (store.tool === 'shape') {
        if (store.shapeType === 'rect') {
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
        } else if (store.shapeType === 'ellipse') {
          drawing = new Ellipse({
            x: startPoint.x,
            y: startPoint.y,
            width: 1,
            height: 1,
            stroke: store.foregroundColor,
            strokeWidth: store.strokeWidth,
            editable: true,
          })
        } else if (store.shapeType === 'line') {
          drawing = createLine(startPoint, false)
        } else if (store.shapeType === 'arrow') {
          drawing = createArrow(startPoint)
        }
      } else if (store.tool === 'magnifier') {
        if (!store.snapshot) {
          store.createSnapshot()
        }
        drawing = new Magnifier({
          x: startPoint.x,
          y: startPoint.y,
          width: 1,
          height: 1,
          stroke: store.isDark ? '#ffffff90' : '#ffffff90',
          strokeWidth: 4,
          strokeAlign: 'outside',
          shadow: {
            x: 4,
            y: 4,
            blur: 6,
            color: store.isDark ? '#ffffff10' : '#00000010',
            box: true,
          },
          editable: true,
        })
      } else if (store.tool === 'mosaic') {
        if (!store.snapshot) {
          store.createSnapshot()
        }
        drawing = new Mosaic({
          x: startPoint.x,
          y: startPoint.y,
          width: 1,
          height: 1,
          stroke: store.isDark ? '#ffffff90' : '#ffffff90',
          strokeWidth: 2,
          strokeAlign: 'outside',
          shadow: {
            x: 2,
            y: 2,
            blur: 4,
            color: store.isDark ? '#ffffff10' : '#00000010',
            box: true,
          },
          editable: true,
        })
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

        if (drawing instanceof Magnifier) {
          const max = Math.max(width, height)
          drawing.width = max
          drawing.height = max
        } else if (drawing instanceof Mosaic) {
          drawing.width = width
          drawing.height = height
        } else {
          drawing.width = width
          drawing.height = height
        }
      } else if (drawing instanceof Line) {
        if (store.tool === 'pen') {
          const points = drawing.points as number[]
          drawing.points = [...points, point.x, point.y]
        } else if (store.tool === 'shape' && store.shapeType === 'arrow') {
          drawing.points = getArrowPoints(startPoint, point, store.strokeWidth)
        } else {
          drawing.points = [startPoint.x, startPoint.y, point.x, point.y]
        }
      }
    }

    const onDragEnd = async () => {
      if (drawing instanceof Magnifier && store.snapshot) {
        applyMagnifierFill(drawing)
        setupMagnifierListener(drawing)
        app.editor?.select(drawing)
        store.setTool('select')
      } else if (drawing instanceof Mosaic && store.snapshot) {
        drawing.stroke = undefined
        drawing.strokeWidth = undefined
        drawing.shadow = undefined
        await applyMosaicFill(drawing)
        setupMosaicListener(drawing)
        app.editor?.select(drawing)
        store.setTool('select')
      } else if (drawing && store.tool === 'shape') {
        app.editor?.select(drawing)
        store.setTool('select')
      }
      drawing = null
      startPoint = null
    }

    const applyMagnifierFill = (magnifier: Magnifier) => {
      if (!store.snapshot) return
      if (
        typeof magnifier.x !== 'number' ||
        typeof magnifier.y !== 'number' ||
        typeof magnifier.width !== 'number' ||
        typeof magnifier.height !== 'number'
      ) {
        return
      }

      const offsetX = -magnifier.x * 2 - magnifier.width / 2
      const offsetY = -magnifier.y * 2 - magnifier.height / 2

      magnifier.fill = [
        { type: 'solid', color: store.isDark ? '#000000' : '#ffffff' },
        {
          type: 'image',
          url: store.snapshot.data,
          mode: 'clip',
          size: {
            width: store.snapshot.width,
            height: store.snapshot.height,
          },
          offset: { x: offsetX, y: offsetY },
        },
        {
          type: 'linear',
          from: 'top',
          to: 'bottom',
          stops: [
            { offset: 0, color: store.isDark ? '#000000aa' : '#ffffffaa' },
            { offset: 0.48, color: store.isDark ? '#00000000' : '#ffffff00' },
          ],
        },
      ]
    }

    const setupMagnifierListener = (magnifier: Magnifier) => {
      let lastOffset = { x: 0, y: 0 }

      const updateFill = () => {
        if (!store.snapshot) return
        if (
          typeof magnifier.x !== 'number' ||
          typeof magnifier.y !== 'number' ||
          typeof magnifier.width !== 'number' ||
          typeof magnifier.height !== 'number'
        ) {
          return
        }

        const offsetX = -magnifier.x * 2 - magnifier.width / 2
        const offsetY = -magnifier.y * 2 - magnifier.height / 2

        if (lastOffset.x === offsetX && lastOffset.y === offsetY) return

        lastOffset = { x: offsetX, y: offsetY }
        applyMagnifierFill(magnifier)
      }

      magnifier.on(PropertyEvent.CHANGE, (event: any) => {
        if (!store.snapshot) return
        if (!['x', 'y', 'width', 'height'].includes(event.attrName)) return
        updateFill()
      })
    }

    const applyMosaicFill = async (mosaic: Mosaic) => {
      if (!store.snapshot) return
      if (
        typeof mosaic.x !== 'number' ||
        typeof mosaic.y !== 'number' ||
        typeof mosaic.width !== 'number' ||
        typeof mosaic.height !== 'number'
      ) {
        return
      }

      const pixelSize = 40
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.src = store.snapshot.data

      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      })

      const sourceX = mosaic.x * 2
      const sourceY = mosaic.y * 2
      const sourceWidth = mosaic.width * 2
      const sourceHeight = mosaic.height * 2

      const smallWidth = Math.max(1, Math.ceil(sourceWidth / pixelSize))
      const smallHeight = Math.max(1, Math.ceil(sourceHeight / pixelSize))

      canvas.width = mosaic.width
      canvas.height = mosaic.height

      ctx.imageSmoothingEnabled = false

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      tempCanvas.width = smallWidth
      tempCanvas.height = smallHeight
      tempCtx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        smallWidth,
        smallHeight
      )

      ctx.drawImage(
        tempCanvas,
        0,
        0,
        smallWidth,
        smallHeight,
        0,
        0,
        mosaic.width,
        mosaic.height
      )

      const mosaicData = canvas.toDataURL()

      mosaic.fill = {
        type: 'image',
        url: mosaicData,
        mode: 'clip',
      }
    }

    const setupMosaicListener = (mosaic: Mosaic) => {
      let lastPos = { x: 0, y: 0, width: 0, height: 0 }

      const updateFill = async () => {
        if (!store.snapshot) return
        if (
          typeof mosaic.x !== 'number' ||
          typeof mosaic.y !== 'number' ||
          typeof mosaic.width !== 'number' ||
          typeof mosaic.height !== 'number'
        ) {
          return
        }

        if (
          lastPos.x === mosaic.x &&
          lastPos.y === mosaic.y &&
          lastPos.width === mosaic.width &&
          lastPos.height === mosaic.height
        ) {
          return
        }

        lastPos = {
          x: mosaic.x,
          y: mosaic.y,
          width: mosaic.width,
          height: mosaic.height,
        }
        await applyMosaicFill(mosaic)
      }

      mosaic.on(PropertyEvent.CHANGE, (event: any) => {
        if (!store.snapshot) return
        if (!['x', 'y', 'width', 'height'].includes(event.attrName)) return
        updateFill()
      })
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
    store.shapeType,
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
