import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { CropperRef } from 'react-advanced-cropper'
import { useTranslation } from 'react-i18next'
import { Video } from 'lucide-react'
import { tw } from 'share/theme'
import { ToasterProvider } from 'share/components/Toaster'
import toast from 'react-hot-toast'
import Toolbar from './components/Toolbar'
import VideoCropper from './components/VideoCropper'
import store from './store'
import { isVideoFileName } from './lib/util'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const cropperRef = useRef<CropperRef>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (store.isExporting) return

    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!file.type.startsWith('video/') && !isVideoFileName(file.name)) {
      toast.error(t('unsupportedFile'))
      return
    }

    const filePath = tinker.getPathForFile(file)
    if (!filePath) {
      toast.error(t('openFailed'))
      return
    }

    try {
      await store.loadVideo(filePath)
    } catch (err) {
      console.error('Failed to load video:', err)
      toast.error(t('openFailed'))
    }
  }

  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col ${tw.bg.primary}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Toolbar cropperRef={cropperRef} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {!store.hasVideo ? (
            <button
              className="flex-1 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => {
                void store.openVideoDialog().catch((err) => {
                  console.error('Failed to open video:', err)
                  toast.error(t('openFailed'))
                })
              }}
            >
              <Video
                className={`w-10 h-10 ${tw.gray.text400}`}
                strokeWidth={1.5}
              />
              <p className={`text-sm mt-3 ${tw.text.primary}`}>
                {t('openTitle')}
              </p>
              <p className={`text-xs mt-1 ${tw.text.secondary}`}>
                {t('supportedFormats')}
              </p>
            </button>
          ) : (
            <VideoCropper cropperRef={cropperRef} />
          )}
        </div>
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
