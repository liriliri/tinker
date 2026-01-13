import React, { useState } from 'react'
import { File } from 'lucide-react'
import { tw } from 'share/theme'

interface FileOpenProps {
  onOpenFile: (file: File) => Promise<void>
  openTitle: string
  supportedFormats: string
  fileName?: string
}

const FileOpen: React.FC<FileOpenProps> = ({
  onOpenFile,
  openTitle,
  supportedFormats,
  fileName,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (file) {
        try {
          await onOpenFile(file)
        } catch (err) {
          console.error('Failed to open file:', err)
        }
      }
    }
    input.click()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    try {
      await onOpenFile(file)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
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
          className={`text-lg font-medium ${tw.text.both.primary} mb-2 max-w-full break-all px-4`}
          title={fileName}
        >
          {fileName || openTitle}
        </p>
        <p
          className={`text-sm ${tw.gray.light.text500} ${tw.gray.light.text400}`}
        >
          {fileName ? '' : supportedFormats}
        </p>
      </div>
    </div>
  )
}

export default FileOpen
