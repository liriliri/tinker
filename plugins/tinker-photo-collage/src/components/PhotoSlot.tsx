import { observer } from 'mobx-react-lite'
import { Plus } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import openFile from 'licia/openFile'
import store from '../store'

interface PhotoSlotProps {
  areaName: string
}

const PhotoSlot = observer(({ areaName }: PhotoSlotProps) => {
  const slot = store.photoSlots.find((s) => s.areaName === areaName)
  const photo = slot?.photoId
    ? store.photos.find((p) => p.id === slot.photoId)
    : null

  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)

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
    if (hasDragged) {
      setHasDragged(false)
      return
    }
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
    setIsDragging(true)
    setHasDragged(false)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    if (!isDragging || !slot) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setHasDragged(true)
      }
      store.setPhotoOffset(
        areaName,
        slot.offsetX + deltaX,
        slot.offsetY + deltaY
      )
      setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, areaName, slot])

  const borderRadiusStyle = store.radiusEnabled ? `${store.radius}px` : '0px'

  const imageStyle = slot
    ? {
        transform: `translate(${slot.offsetX}px, ${slot.offsetY}px) scale(${slot.scale})`,
        transformOrigin: 'center center',
      }
    : {}

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center cursor-pointer"
      style={{
        gridArea: areaName,
        borderRadius: borderRadiusStyle,
        backgroundColor: store.imageBgColor,
      }}
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
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
