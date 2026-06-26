import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clamp from 'licia/clamp'
import clone from 'licia/clone'
import sum from 'licia/sum'
import { tw } from 'share/theme'
import store from '../store'
import {
  getDisplayCellLayouts,
  getGridDividerPositions,
  moveCropRegion,
  resizeAdjacentSizes,
  resizeCropRegion,
} from '../lib/split'
import type { CropHandle, CropRegion } from '../types'
import CellIndexBadge from './CellIndexBadge'
import GridResizer from './GridResizer'

interface CropResizeDragState {
  type: 'crop-resize'
  handle: CropHandle
  startCrop: CropRegion
  startX: number
  startY: number
}

interface CropMoveDragState {
  type: 'crop-move'
  startCrop: CropRegion
  startX: number
  startY: number
}

interface GridDragState {
  type: 'grid-row' | 'grid-col'
  index: number
  startSizes: number[]
  startX: number
  startY: number
}

type CanvasDragState = CropResizeDragState | CropMoveDragState | GridDragState

const HANDLE_SIZE = 8
const MIN_LABEL_WIDTH = 24
const MIN_LABEL_HEIGHT = 18

const CROP_HANDLES: Array<{ handle: CropHandle; className: string }> = [
  {
    handle: 'nw',
    className:
      'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
  },
  {
    handle: 'n',
    className:
      'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
  },
  {
    handle: 'ne',
    className:
      'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
  },
  {
    handle: 'e',
    className:
      'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
  },
  {
    handle: 'se',
    className:
      'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
  },
  {
    handle: 's',
    className:
      'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
  },
  {
    handle: 'sw',
    className:
      'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
  },
  {
    handle: 'w',
    className:
      'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
  },
]

const SplitCanvas = observer(function SplitCanvas() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [displayScale, setDisplayScale] = useState(1)
  const dragStateRef = useRef<CanvasDragState | null>(null)

  const image = store.image
  const cropRegion = store.cropRegion

  const updateScale = useCallback(() => {
    if (!containerRef.current || !image) return

    const padding = 64
    const containerWidth = containerRef.current.clientWidth - padding
    const containerHeight = containerRef.current.clientHeight - padding

    if (containerWidth <= 0 || containerHeight <= 0) return

    const scaleX = containerWidth / image.width
    const scaleY = containerHeight / image.height
    setDisplayScale(clamp(Math.min(scaleX, scaleY), 1))
  }, [image])

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)

    const resizeObserver = new ResizeObserver(updateScale)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateScale)
      resizeObserver.disconnect()
    }
  }, [updateScale])

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !image) {
        return { x: 0, y: 0 }
      }

      const rect = containerRef.current.getBoundingClientRect()
      const displayWidth = image.width * displayScale
      const displayHeight = image.height * displayScale
      const offsetX = (rect.width - displayWidth) / 2
      const offsetY = (rect.height - displayHeight) / 2
      const x = (clientX - rect.left - offsetX) / displayScale
      const y = (clientY - rect.top - offsetY) / displayScale

      return { x, y }
    },
    [displayScale, image]
  )

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current
      if (!dragState || !image) return

      const { x, y } = toImageCoords(event.clientX, event.clientY)

      if (dragState.type === 'crop-resize') {
        const dx = x - dragState.startX
        const dy = y - dragState.startY
        const nextCrop = resizeCropRegion(
          dragState.handle,
          dragState.startCrop,
          dx,
          dy,
          image.width,
          image.height,
          store.rows,
          store.cols
        )
        store.setCropRegion(nextCrop)
        return
      }

      if (dragState.type === 'crop-move') {
        const dx = x - dragState.startX
        const dy = y - dragState.startY
        store.setCropRegion(
          moveCropRegion(dragState.startCrop, dx, dy, image.width, image.height)
        )
        return
      }

      const delta =
        dragState.type === 'grid-row'
          ? y - dragState.startY
          : x - dragState.startX
      const totalSize =
        dragState.type === 'grid-row' ? cropRegion.height : cropRegion.width
      const currentTotal = sum(...dragState.startSizes)
      const pixelPerFr = totalSize / currentTotal
      const deltaFr = delta / pixelPerFr
      const nextSizes = resizeAdjacentSizes(
        dragState.startSizes,
        dragState.index,
        deltaFr
      )

      if (!nextSizes) return

      if (dragState.type === 'grid-row') {
        store.setRowSizes(nextSizes)
      } else {
        store.setColSizes(nextSizes)
      }
    }

    const handleMouseUp = () => {
      dragStateRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [cropRegion.height, cropRegion.width, image, store.cols, store.rows, toImageCoords])

  const displayWidth = image ? image.width * displayScale : 0
  const displayHeight = image ? image.height * displayScale : 0
  const overlayLeft = cropRegion.left * displayScale
  const overlayTop = cropRegion.top * displayScale
  const overlayWidth = cropRegion.width * displayScale
  const overlayHeight = cropRegion.height * displayScale

  const rowPositions = useMemo(
    () => getGridDividerPositions(overlayHeight, store.rowSizes),
    [overlayHeight, store.rowSizes]
  )
  const colPositions = useMemo(
    () => getGridDividerPositions(overlayWidth, store.colSizes),
    [overlayWidth, store.colSizes]
  )

  const cellLayouts = useMemo(
    () => getDisplayCellLayouts(store.cells, cropRegion, displayScale),
    [cropRegion, displayScale, store.cells]
  )

  const startCropDrag = (handle: CropHandle, event: React.MouseEvent) => {
    event.stopPropagation()
    const { x, y } = toImageCoords(event.clientX, event.clientY)
    dragStateRef.current = {
      type: 'crop-resize',
      handle,
      startCrop: { ...store.cropRegion },
      startX: x,
      startY: y,
    }
  }

  const startMoveDrag = (event: React.MouseEvent) => {
    const { x, y } = toImageCoords(event.clientX, event.clientY)
    dragStateRef.current = {
      type: 'crop-move',
      startCrop: { ...store.cropRegion },
      startX: x,
      startY: y,
    }
  }

  const startGridDrag = (
    type: 'grid-row' | 'grid-col',
    index: number,
    event: React.MouseEvent
  ) => {
    const { x, y } = toImageCoords(event.clientX, event.clientY)
    dragStateRef.current = {
      type,
      index,
      startSizes:
        type === 'grid-row' ? clone(store.rowSizes) : clone(store.colSizes),
      startX: x,
      startY: y,
    }
  }

  if (!image) return null

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden p-8"
    >
      <div
        className="relative select-none"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <img
          src={image.originalUrl}
          alt={t('previewImageAlt')}
          draggable={false}
          className="block max-w-none"
          style={{ width: displayWidth, height: displayHeight }}
        />

        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-0 right-0 top-0 bg-black/45"
            style={{ height: overlayTop }}
          />
          <div
            className="absolute left-0 right-0 bg-black/45"
            style={{ top: overlayTop + overlayHeight, bottom: 0 }}
          />
          <div
            className="absolute bg-black/45"
            style={{
              left: 0,
              top: overlayTop,
              width: overlayLeft,
              height: overlayHeight,
            }}
          />
          <div
            className="absolute bg-black/45"
            style={{
              left: overlayLeft + overlayWidth,
              top: overlayTop,
              right: 0,
              height: overlayHeight,
            }}
          />
        </div>

        <div
          className={`absolute border ${tw.primary.border} pointer-events-auto cursor-move`}
          style={{
            left: overlayLeft,
            top: overlayTop,
            width: overlayWidth,
            height: overlayHeight,
          }}
          onMouseDown={startMoveDrag}
        >
          {cellLayouts.map((cell) => (
            <div
              key={cell.index}
              className="absolute"
              style={{
                left: cell.left,
                top: cell.top,
                width: cell.width,
                height: cell.height,
              }}
            >
              {cell.width >= MIN_LABEL_WIDTH &&
                cell.height >= MIN_LABEL_HEIGHT && (
                  <CellIndexBadge index={cell.index} />
                )}
            </div>
          ))}

          {rowPositions.map((pos, index) => (
            <div
              key={`row-${index}`}
              className="absolute left-0 right-0 z-10"
              style={{ top: pos, transform: 'translateY(-50%)' }}
            >
              <div
                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px ${tw.primary.bg} opacity-70 pointer-events-none`}
              />
              <GridResizer
                direction="row"
                onMouseDown={(event) => startGridDrag('grid-row', index, event)}
              />
            </div>
          ))}

          {colPositions.map((pos, index) => (
            <div
              key={`col-${index}`}
              className="absolute top-0 bottom-0 z-10"
              style={{ left: pos, transform: 'translateX(-50%)' }}
            >
              <div
                className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px ${tw.primary.bg} opacity-70 pointer-events-none`}
              />
              <GridResizer
                direction="col"
                onMouseDown={(event) => startGridDrag('grid-col', index, event)}
              />
            </div>
          ))}

          {CROP_HANDLES.map(({ handle, className: handleClassName }) => (
            <div
              key={handle}
              className={`absolute ${handleClassName} ${tw.primary.bg} border border-white rounded-sm z-30`}
              style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
              onMouseDown={(event) => startCropDrag(handle, event)}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

export default SplitCanvas
