import React, { useState } from 'react'
import { File } from 'lucide-react'
import { tw } from 'share/theme'

interface FileOpenProps {
  onOpenFile: () => Promise<void>
  openTitle: string
  supportedFormats: string
}

const FileOpen: React.FC<FileOpenProps> = ({
  onOpenFile,
  openTitle,
  supportedFormats,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = async () => {
    try {
      await onOpenFile()
    } catch (err) {
      console.error('Failed to open file:', err)
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
          : `${tw.gray.light.border400} ${tw.gray.dark.border200} ${tw.primary.hoverBorder} dark:hover:border-[#0fc25e]`
      }`}
    >
      <div className="text-center p-8 pointer-events-none">
        <File
          className={`w-16 h-16 mx-auto mb-4 ${tw.gray.light.text400} ${tw.gray.dark.text300}`}
          strokeWidth={1.5}
        />

        <p
          className={`text-lg font-medium ${tw.text.light.primary} ${tw.gray.dark.text400} mb-2`}
        >
          {openTitle}
        </p>
        <p
          className={`text-sm ${tw.gray.light.text500} ${tw.gray.light.text400}`}
        >
          {supportedFormats}
        </p>
      </div>
    </div>
  )
}

export default FileOpen
