import React, { useState } from 'react'
import { FolderOpen as FolderOpenIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

export default function FolderOpen() {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      store.openDirectory(result.filePaths[0])
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

    const file = files[0] as File & { path?: string }
    if (file.path) {
      try {
        const stats = await tinker.fstat(file.path)
        if (stats.isDirectory) {
          store.openDirectory(file.path)
        }
      } catch {
        store.openDirectory(file.path)
      }
    }
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
          <p className={`text-sm ${tw.text.primary}`}>{t('openFolder')}</p>
          <p className={`text-xs mt-1 ${tw.text.secondary}`}>
            {t('dropFolderHere')}
          </p>
        </div>
      </div>
    </div>
  )
}
