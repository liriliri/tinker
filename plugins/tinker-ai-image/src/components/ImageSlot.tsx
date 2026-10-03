import { useState } from 'react'
import fileUrl from 'licia/fileUrl'
import { ImagePlus, X } from 'lucide-react'
import { tw } from 'share/theme'
import { getDroppedAiImagePath } from '../lib/util'

interface ImageSlotProps {
  path: string
  alt: string
  emptyHint: string
  clearTitle: string
  onChoose: () => void
  onClear: () => void
  onSetPath: (path: string) => void
}

export default function ImageSlot({
  path,
  alt,
  emptyHint,
  clearTitle,
  onChoose,
  onClear,
  onSetPath,
}: ImageSlotProps) {
  const [dropHighlight, setDropHighlight] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    if (!dropHighlight) setDropHighlight(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropHighlight(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropHighlight(false)
    const dropped = getDroppedAiImagePath(e.dataTransfer)
    if (dropped) onSetPath(dropped)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded border overflow-hidden aspect-video ${
        dropHighlight
          ? `${tw.primary.border} ${tw.bg.secondary}`
          : `${tw.border} ${tw.bg.primary}`
      }`}
    >
      {path ? (
        <>
          <button
            type="button"
            onClick={onChoose}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={fileUrl(path)}
              alt={alt}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </button>
          <button
            type="button"
            onClick={onClear}
            title={clearTitle}
            className={`absolute top-1.5 right-1.5 z-10 p-1 rounded ${tw.bg.secondary} ${tw.hover} ${tw.text.tertiary}`}
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onChoose}
          className={`w-full h-full ${tw.hover} flex flex-col items-center justify-center gap-2 border-0 bg-transparent`}
        >
          <ImagePlus size={24} className={tw.text.tertiary} strokeWidth={1.5} />
          <span className={`text-xs ${tw.text.tertiary}`}>{emptyHint}</span>
        </button>
      )}
    </div>
  )
}
