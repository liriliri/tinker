import React, { useState } from 'react'
import { FolderOpen as FolderOpenIcon } from 'lucide-react'
import { tw } from 'share/theme'

interface FolderOpenProps {
  onOpenFolder: (path: string) => void
  openTitle: string
  dropTitle?: string
}

const FolderOpen: React.FC<FolderOpenProps> = ({
  onOpenFolder,
  openTitle,
  dropTitle,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    const [dirPath] = result.filePaths
    if (result.canceled || !dirPath) return

    onOpenFolder(dirPath)
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

    const file = files[0] as File & { path?: string }
    if (!file?.path) return

    onOpenFolder(file.path)
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
        <FolderOpenIcon
          className={`w-10 h-10 ${tw.gray.text400}`}
          strokeWidth={1.5}
        />
        <div className="text-center">
          <p className={`text-sm ${tw.text.primary}`}>{openTitle}</p>
          {dropTitle && (
            <p className={`text-xs mt-1 ${tw.text.secondary}`}>{dropTitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FolderOpen
