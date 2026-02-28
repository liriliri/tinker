import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useState } from 'react'
import { THEME_COLORS } from 'share/theme'
import store from '../store'
import { getTemplateById } from '../lib/templates'
import PhotoSlot from './PhotoSlot'
import GridResizer from './GridResizer'

const CollageCanvas = observer(() => {
  const template = getTemplateById(store.selectedTemplateId)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const initialRowSizesRef = useRef<number[]>([])
  const initialColSizesRef = useRef<number[]>([])

  const handleRowResize = (index: number, totalDelta: number) => {
    if (!canvasRef.current) return

    if (totalDelta === 0 || initialRowSizesRef.current.length === 0) {
      initialRowSizesRef.current = [...store.customRowSizes]
      return
    }

    const totalHeight =
      store.canvasHeight -
      store.padding * 2 -
      store.spacing * (store.customRowSizes.length - 1)
    const currentTotal = initialRowSizesRef.current.reduce(
      (sum, size) => sum + size,
      0
    )
    const pixelPerFr = totalHeight / currentTotal
    const deltaFr = totalDelta / (pixelPerFr * scale)

    if (index < initialRowSizesRef.current.length - 1) {
      const newSize1 = initialRowSizesRef.current[index] + deltaFr
      const newSize2 = initialRowSizesRef.current[index + 1] - deltaFr

      if (newSize1 >= 0.5 && newSize2 >= 0.5) {
        store.setRowSize(index, newSize1)
        store.setRowSize(index + 1, newSize2)
      }
    }
  }

  const handleColResize = (index: number, totalDelta: number) => {
    if (!canvasRef.current) return

    if (totalDelta === 0 || initialColSizesRef.current.length === 0) {
      initialColSizesRef.current = [...store.customColSizes]
      return
    }

    const totalWidth =
      store.canvasWidth -
      store.padding * 2 -
      store.spacing * (store.customColSizes.length - 1)
    const currentTotal = initialColSizesRef.current.reduce(
      (sum, size) => sum + size,
      0
    )
    const pixelPerFr = totalWidth / currentTotal
    const deltaFr = totalDelta / (pixelPerFr * scale)

    if (index < initialColSizesRef.current.length - 1) {
      const newSize1 = initialColSizesRef.current[index] + deltaFr
      const newSize2 = initialColSizesRef.current[index + 1] - deltaFr

      if (newSize1 >= 0.5 && newSize2 >= 0.5) {
        store.setColSize(index, newSize1)
        store.setColSize(index + 1, newSize2)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    )

    if (files.length === 0) return

    store.addPhotos(files)

    setTimeout(() => {
      const actualNewPhotos = store.photos.slice(-files.length)
      store.autoFillSlots(actualNewPhotos.map((p) => p.id))
    }, 0)
  }

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return

      const padding = 64
      const containerWidth = containerRef.current.clientWidth - padding
      const containerHeight = containerRef.current.clientHeight - padding

      if (containerWidth <= 0 || containerHeight <= 0) return

      const scaleX = containerWidth / store.canvasWidth
      const scaleY = containerHeight / store.canvasHeight
      const newScale = Math.min(scaleX, scaleY, 1)

      setScale(newScale)
    }

    setTimeout(updateScale, 0)

    window.addEventListener('resize', updateScale)

    const resizeObserver = new ResizeObserver(updateScale)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateScale)
      resizeObserver.disconnect()
    }
  }, [store.canvasWidth, store.canvasHeight])

  if (!template) {
    return null
  }

  const getGridTemplateRowsAndCols = () => {
    if (store.customGridTemplate) {
      const [rows, cols] = store.customGridTemplate.split(' / ')
      return { rows, cols }
    }
    const [rows, cols] = template.gridTemplate.split(' / ')
    return { rows, cols }
  }

  const { rows, cols } = getGridTemplateRowsAndCols()

  const canvasStyle = {
    display: 'grid',
    gridTemplateRows: rows,
    gridTemplateColumns: cols,
    gridTemplateAreas: template.gridAreas,
    gap: `${store.spacing}px`,
    padding: `${store.padding}px`,
    width: `${store.canvasWidth}px`,
    height: `${store.canvasHeight}px`,
    flexShrink: 0,
    flexGrow: 0,
    backgroundColor: store.canvasBgColor,
    backgroundImage: store.backgroundImage
      ? `url(${store.backgroundImage})`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: isDragging
      ? `0 0 0 4px ${THEME_COLORS.primary}80, 0 25px 50px -12px rgb(0 0 0 / 0.25)`
      : '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    transition: 'box-shadow 0.2s ease',
  }

  const wrapperStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    flexShrink: 0,
    flexGrow: 0,
  }

  const calculateResizerPositions = () => {
    const rowPositions: number[] = []
    const colPositions: number[] = []

    if (store.customRowSizes.length > 1) {
      const totalHeight = store.canvasHeight - store.padding * 2
      const currentTotal = store.customRowSizes.reduce(
        (sum, size) => sum + size,
        0
      )
      let accumulated = store.padding

      for (let i = 0; i < store.customRowSizes.length - 1; i++) {
        accumulated +=
          (store.customRowSizes[i] / currentTotal) *
          (totalHeight - store.spacing * (store.customRowSizes.length - 1))
        rowPositions.push(accumulated + store.spacing / 2)
        accumulated += store.spacing
      }
    }

    if (store.customColSizes.length > 1) {
      const totalWidth = store.canvasWidth - store.padding * 2
      const currentTotal = store.customColSizes.reduce(
        (sum, size) => sum + size,
        0
      )
      let accumulated = store.padding

      for (let i = 0; i < store.customColSizes.length - 1; i++) {
        accumulated +=
          (store.customColSizes[i] / currentTotal) *
          (totalWidth - store.spacing * (store.customColSizes.length - 1))
        colPositions.push(accumulated + store.spacing / 2)
        accumulated += store.spacing
      }
    }

    return { rowPositions, colPositions }
  }

  const { rowPositions, colPositions } = calculateResizerPositions()

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={wrapperStyle}>
        <div style={{ position: 'relative' }}>
          <div id="collage-canvas" ref={canvasRef} style={canvasStyle}>
            {template.areas.map((area) => (
              <PhotoSlot key={area} areaName={area} />
            ))}
          </div>

          {rowPositions.map((pos, index) => (
            <div
              key={`row-${index}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${pos}px`,
                height: `${store.spacing}px`,
                transform: 'translateY(-50%)',
                zIndex: 10,
              }}
            >
              <GridResizer
                direction="row"
                index={index}
                onResize={handleRowResize}
              />
            </div>
          ))}

          {colPositions.map((pos, index) => (
            <div
              key={`col-${index}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${pos}px`,
                width: `${store.spacing}px`,
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              <GridResizer
                direction="col"
                index={index}
                onResize={handleColResize}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default CollageCanvas
