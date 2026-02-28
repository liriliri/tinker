import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FilePlus2 } from 'lucide-react'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import MediaList from './components/MediaList'
import store from './store'
import { VIDEO_EXTENSIONS, AUDIO_EXTENSIONS } from './lib/constants'

export default observer(function App() {
  const { t } = useTranslation()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (store.isCompressing) return

    const extensions =
      store.mode === 'video' ? VIDEO_EXTENSIONS : AUDIO_EXTENSIONS
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
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors m-4 ${tw.gray.border400} ${tw.primary.hoverBorder}`}
          >
            <div className="text-center p-8 pointer-events-none">
              <FilePlus2
                className={`w-16 h-16 mx-auto mb-4 ${tw.gray.text400}`}
                strokeWidth={1.5}
              />
              <p className={`text-lg font-medium ${tw.text.primary}`}>
                {store.mode === 'video'
                  ? t('openTitleVideo')
                  : t('openTitleAudio')}
              </p>
            </div>
          </div>
        ) : (
          <MediaList />
        )}
      </div>
    </div>
  )
})
