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
      className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${
        isDragging ? tw.bg.secondary : ''
      }`}
    >
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <ImagePlus
          className={`w-10 h-10 ${tw.gray.text400}`}
          strokeWidth={1.5}
        />
        <div className="text-center">
          <p className={`text-sm ${tw.text.primary}`}>{openTitle}</p>
          <p className={`text-xs mt-1 ${tw.text.secondary}`}>
            {supportedFormats}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ImageOpen
