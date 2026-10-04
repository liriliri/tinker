import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { App, Frame, DragEvent, ResizeEvent } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/export'
import '@leafer-in/viewport'
import '@leafer-in/view'
import { THEME_COLORS } from 'share/theme'
import find from 'licia/find'
import isNum from 'licia/isNum'
import isStr from 'licia/isStr'
import some from 'licia/some'
import store from '../store'
import { gradientPresets } from '../lib/gradients'
import { applyScene, clampCenterToCanvas, prepareScene } from '../lib/scene'

interface SceneLeaf {
  id?: unknown
  parent?: unknown
  x?: number
  y?: number
  width?: number
  height?: number
  scaleX?: number
  scaleY?: number
}

function findDeviceGroup(leaf: SceneLeaf | null): SceneLeaf | null {
  let current: SceneLeaf | null | undefined = leaf
  while (current) {
    const id = current.id
    if (isStr(id) && some(store.sceneObjects, (o) => o.id === id)) {
      return current
    }
    current = current.parent as SceneLeaf | null
  }
  return null
}

function resolveSceneObjectId(leaf: SceneLeaf | null) {
  return findDeviceGroup(leaf)?.id as string | undefined
}

function constrainDevice(leaf: SceneLeaf | null) {
  const group = findDeviceGroup(leaf)
  if (!group) return
  const { width, height } = store.canvasSize
  const scaleX = isNum(group.scaleX) ? group.scaleX : 1
  const scaleY = isNum(group.scaleY) ? group.scaleY : 1
  const pos = clampCenterToCanvas(
    group.x || 0,
    group.y || 0,
    (group.width || 0) * scaleX,
    (group.height || 0) * scaleY,
    width,
    height
  )
  group.x = pos.x
  group.y = pos.y
}

const Canvas = observer(function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const fittedSizeRef = useRef('')
  const rebuildingRef = useRef(false)
  const rebuildGenRef = useRef(0)

  useEffect(() => {
    const target = containerRef.current
    if (!target) return

    const app = new App({
      view: target,
      editor: {
        lockRatio: 'corner',
        stroke: THEME_COLORS.primary,
        rotateable: true,
        skewable: false,
        hover: false,
      },
      move: {
        disabled: true,
      },
      wheel: {
        disabled: true,
      },
      tree: { usePartRender: true, type: 'design' },
      sky: { type: 'draw', usePartRender: true },
    })

    const frame = new Frame({
      id: 'canvas-frame',
      x: 0,
      y: 0,
      width: store.canvasSize.width,
      height: store.canvasSize.height,
      fill: gradientPresets[0].colors[0],
      draggable: false,
      editable: false,
    })
    app.tree.add(frame)

    store.setApp(app)
    store.setFrame(frame)

    const syncSelection = () => {
      const selected = app.editor?.list?.[0]
      const objectId = resolveSceneObjectId(selected ?? null)
      if (objectId) {
        store.selectObject(objectId)
        return
      }
      if (rebuildingRef.current) return
      store.selectObject(null)
    }
    app.editor?.on('editor.select', syncSelection)

    const handleResize = () => {
      store.zoomFit()
    }

    app.tree.on(ResizeEvent.RESIZE, handleResize)

    const onDrag = (e: DragEvent) => {
      constrainDevice((e.target || e.current) as SceneLeaf | null)
      const selected = app.editor?.list?.[0]
      if (selected) constrainDevice(selected as SceneLeaf)
    }
    const onDragEnd = () => {
      store.syncLiveTransforms()
    }
    app.tree.on(DragEvent.DRAG, onDrag)
    app.tree.on(DragEvent.END, onDragEnd)

    requestAnimationFrame(() => {
      store.zoomFit()
    })

    return () => {
      app.tree.off(DragEvent.DRAG, onDrag)
      app.tree.off(DragEvent.END, onDragEnd)
      app.tree.off(ResizeEvent.RESIZE, handleResize)
      app.editor?.off('editor.select', syncSelection)
      store.setApp(null)
      store.setFrame(null)
      app.destroy()
    }
  }, [])

  useEffect(() => {
    const frame = store.frame
    const app = store.app
    if (!frame) return

    const gen = ++rebuildGenRef.current
    const sizeKey = `${store.canvasSize.width}x${store.canvasSize.height}`
    rebuildingRef.current = true
    store.syncLiveTransforms()
    const selectedId = store.selectedObjectId
    const prepared = prepareScene(
      store.canvasSize,
      store.background,
      store.sceneObjects
    )
    if (gen !== rebuildGenRef.current) return
    applyScene(frame, store.canvasSize, store.background, prepared)
    if (gen !== rebuildGenRef.current) return
    if (selectedId) {
      const node = find(prepared.groups, (g) => g.id === selectedId)
      if (node) app?.editor?.select(node)
      store.selectObject(selectedId)
    }
    if (gen === rebuildGenRef.current) rebuildingRef.current = false
    if (fittedSizeRef.current !== sizeKey) {
      fittedSizeRef.current = sizeKey
      requestAnimationFrame(() => store.zoomFit())
    }
  }, [store.sceneRevision, store.frame])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
})

export default Canvas
