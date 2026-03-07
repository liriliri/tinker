import React, { useState } from 'react'
import { File } from 'lucide-react'
import openFile from 'licia/openFile'
import { tw } from 'share/theme'

interface FileOpenProps {
  onOpenFile: (file: File) => Promise<void>
  openTitle: string
  supportedFormats?: string
  fileName?: string
}

const FileOpen: React.FC<FileOpenProps> = ({
  onOpenFile,
  openTitle,
  supportedFormats,
  fileName,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileOpen = async (file: File) => {
    try {
      await onOpenFile(file)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  const handleClick = async () => {
    try {
      const files = await openFile()
      if (files && files.length > 0) {
        await handleFileOpen(files[0])
      }
    } catch (err) {
      console.error('Failed to open file:', err)
    }
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

    await handleFileOpen(files[0])
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${
        isDragging ? tw.bg.secondary : ''
      }`}
    >
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <File className={`w-10 h-10 ${tw.gray.text400}`} strokeWidth={1.5} />
        <div className="text-center">
          <p
            className={`text-sm ${tw.text.primary} max-w-xs break-all`}
            title={fileName}
          >
            {fileName || openTitle}
          </p>
          {!fileName && supportedFormats && (
            <p className={`text-xs mt-1 ${tw.text.secondary}`}>
              {supportedFormats}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileOpen
