import React, { useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { tw } from '../theme'

interface ImageOpenProps {
  onOpenImage: () => Promise<void>
  openTitle: string
  supportedFormats: string
}

const ImageOpen: React.FC<ImageOpenProps> = ({
  onOpenImage,
  openTitle,
  supportedFormats,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = async () => {
    try {
      await onOpenImage()
    } catch (err) {
      console.error('Failed to open image:', err)
    }
  }

  const handleDragEnter = () => {
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = () => {
    setIsDragging(false)
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors m-4 ${
        isDragging
          ? `${tw.primary.border}`
          : `${tw.gray.border400} ${tw.primary.hoverBorder}`
      }`}
    >
      <div className="text-center p-8 pointer-events-none">
        <ImagePlus
          className={`w-16 h-16 mx-auto mb-4 ${tw.gray.text400}`}
          strokeWidth={1.5}
        />

        <p className={`text-lg font-medium ${tw.text.primary} mb-2`}>
          {openTitle}
        </p>
        <p className={`text-sm ${tw.text.secondary}`}>{supportedFormats}</p>
      </div>
    </div>
  )
}

export default ImageOpen
