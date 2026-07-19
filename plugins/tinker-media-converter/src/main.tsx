import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { File } from 'lucide-react'
import each from 'licia/each'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import MediaList from './components/MediaList'
import store from './store'
import { MEDIA_EXTS } from './lib/mediaType'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
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

    const files = filter(Array.from(e.dataTransfer.files), (file) => {
      const ext = lowerCase(splitPath(file.name).ext.slice(1))
      return MEDIA_EXTS.has(ext)
    })

    if (isEmpty(files)) return

    const filePaths: string[] = []
    const fileSizes: Record<string, number> = {}
    each(files, (file) => {
      const filePath = tinker.getPathForFile(file)
      if (filePath) {
        filePaths.push(filePath)
        fileSizes[filePath] = file.size
      }
    })

    if (isEmpty(filePaths)) return

    try {
      await store.loadMediaFiles(filePaths, fileSizes)
    } catch (err) {
      console.error('Failed to load dropped media:', err)
    }
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
              <p className={`text-sm ${tw.text.primary}`}>{t('openTitle')}</p>
            </div>
          </div>
        ) : (
          <MediaList />
        )}
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
