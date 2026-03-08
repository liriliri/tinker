import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { File } from 'lucide-react'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import MediaList from './components/MediaList'
import store from './store'
import {
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  IMAGE_EXTENSIONS,
} from './lib/constants'

export default observer(function App() {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)

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

    if (store.isConverting) return

    let extensions: Set<string>
    if (store.mode === 'video') {
      extensions = VIDEO_EXTENSIONS
    } else if (store.mode === 'audio') {
      extensions = AUDIO_EXTENSIONS
    } else {
      extensions = IMAGE_EXTENSIONS
    }

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
      return extensions.has(ext)
    })

    if (files.length === 0) return

    for (const file of files) {
      const filePath = (file as File & { path?: string }).path
      if (filePath) {
        await store.loadMedia(filePath, file.size)
      }
    }
  }

  const getOpenTitle = () => {
    if (store.mode === 'video') return t('openTitleVideo')
    if (store.mode === 'audio') return t('openTitleAudio')
    return t('openTitleImage')
  }

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.primary}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!store.hasItems ? (
          <div
            onClick={() => store.openMediaDialog()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging ? tw.bg.secondary : ''
            }`}
          >
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <File
                className={`w-10 h-10 ${tw.gray.text400}`}
                strokeWidth={1.5}
              />
              <p className={`text-sm ${tw.text.primary}`}>{getOpenTitle()}</p>
            </div>
          </div>
        ) : (
          <MediaList />
        )}
      </div>
    </div>
  )
})
