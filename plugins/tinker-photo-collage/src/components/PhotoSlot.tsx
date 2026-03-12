import { observer } from 'mobx-react-lite'
import { Plus } from 'lucide-react'
import { useRef, useEffect } from 'react'
import find from 'licia/find'
import openFile from 'licia/openFile'
import store from '../store'

interface PhotoSlotProps {
  areaName: string
  canvasScale: number
}

const PhotoSlot = observer(({ areaName, canvasScale }: PhotoSlotProps) => {
  const slot = find(store.photoSlots, (s) => s.areaName === areaName)
  const photo = slot?.photoId
    ? find(store.photos, (p) => p.id === slot.photoId)
    : null

  const canvasScaleRef = useRef(canvasScale)
  canvasScaleRef.current = canvasScale
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const handleSelectImage = async () => {
    try {
      const files = await openFile({ accept: 'image/*' })
      if (files && files.length > 0) {
        store.addPhotos([files[0]])
        const newPhoto = store.photos[store.photos.length - 1]
        store.setPhotoToSlot(areaName, newPhoto.id)
      }
    } catch (err) {
      console.error('Failed to open image:', err)
    }
  }

  const handleClick = () => {
    if (hasDraggedRef.current) return
    handleSelectImage()
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!photo || !slot) return
    e.preventDefault()

    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3, slot.scale + delta))
    store.setPhotoScale(areaName, newScale)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!photo) return
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    isDraggingRef.current = true
    hasDraggedRef.current = false
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing'
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const slot = find(store.photoSlots, (s) => s.areaName === areaName)
      if (!slot) return

      const deltaX =
        (e.clientX - dragStartRef.current.x) / canvasScaleRef.current
      const deltaY =
        (e.clientY - dragStartRef.current.y) / canvasScaleRef.current
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasDraggedRef.current = true
      }
      store.setPhotoOffset(
        areaName,
        slot.offsetX + deltaX,
        slot.offsetY + deltaY
      )
      dragStartRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      if (containerRef.current) {
        containerRef.current.style.cursor = ''
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [areaName])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    )
    if (files.length > 0) {
      store.addPhotos([files[0]])
      const newPhoto = store.photos[store.photos.length - 1]
      store.setPhotoToSlot(areaName, newPhoto.id)
    }
  }

  const borderRadiusStyle = `${store.radius}px`

  const imageStyle = slot
    ? {
        transform: `translate(${slot.offsetX}px, ${slot.offsetY}px) scale(${slot.scale})`,
        transformOrigin: 'center center',
      }
    : {}

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{
        gridArea: areaName,
        borderRadius: borderRadiusStyle,
        backgroundColor: store.imageBgColor,
        cursor: photo ? 'grab' : 'pointer',
      }}
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {photo ? (
        <img
          src={photo.url}
          alt=""
          className="w-full h-full object-contain select-none"
          style={imageStyle}
          draggable={false}
        />
      ) : (
        <Plus size={48} className="text-white opacity-50" />
      )}
    </div>
  )
})

export default PhotoSlot
