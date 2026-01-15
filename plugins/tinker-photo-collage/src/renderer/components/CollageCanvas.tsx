import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useState } from 'react'
import store from '../store'
import { getTemplateById } from '../lib/templates'
import PhotoSlot from './PhotoSlot'

const CollageCanvas = observer(() => {
  const template = getTemplateById(store.selectedTemplateId)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

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

  const canvasStyle = {
    display: 'grid',
    gridTemplate: template.gridTemplate,
    gridTemplateAreas: template.gridAreas,
    gap: `${store.spacing}px`,
    padding: `${store.padding}px`,
    width: `${store.canvasWidth}px`,
    height: `${store.canvasHeight}px`,
    flexShrink: 0,
    flexGrow: 0,
    backgroundColor: store.canvasBgColor,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  }

  const wrapperStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    flexShrink: 0,
    flexGrow: 0,
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden p-8"
    >
      <div style={wrapperStyle}>
        <div id="collage-canvas" style={canvasStyle}>
          {template.areas.map((area) => (
            <PhotoSlot key={area} areaName={area} />
          ))}
        </div>
      </div>
    </div>
  )
})

export default CollageCanvas
