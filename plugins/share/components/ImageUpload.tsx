import React from 'react'
import { ImagePlus } from 'lucide-react'
import { tw } from '../theme'

interface ImageUploadProps {
  onOpenImage: () => Promise<void>
  uploadTitle: string
  supportedFormats: string
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onOpenImage,
  uploadTitle,
  supportedFormats,
}) => {
  const handleClick = async () => {
    try {
      await onOpenImage()
    } catch (err) {
      console.error('Failed to open image:', err)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#8a8a8a] dark:border-[#6e6e6e] rounded-lg cursor-pointer ${tw.primary.hoverBorder} dark:${tw.primary.hoverBorder} transition-colors m-4`}
    >
      <div className="text-center p-8 pointer-events-none">
        <ImagePlus
          className="w-16 h-16 mx-auto mb-4 text-[#8a8a8a] dark:text-[#6e6e6e]"
          strokeWidth={1.5}
        />

        <p className={`text-lg font-medium ${tw.text.light.primary} dark:text-[#cccccc] mb-2`}>
          {uploadTitle}
        </p>
        <p className="text-sm text-[#6e6e6e] dark:text-[#8a8a8a]">
          {supportedFormats}
        </p>
      </div>
    </div>
  )
}

export default ImageUpload
