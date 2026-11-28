import { useState, type DragEvent } from 'react'
import { firstDroppedImage } from '../lib/util'

/**
 * Shared drag-and-drop target for source images.
 * Tracks the hover state so a drop zone can highlight itself, and forwards
 * the first dropped image file to the callback.
 */
export function useImageDrop(onImage: (file: File) => void) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = firstDroppedImage(e.dataTransfer.files)
    if (!file) return
    onImage(file)
  }

  return { isDragOver, handleDragOver, handleDragLeave, handleDrop }
}
