import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Film } from 'lucide-react'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import { ToasterProvider } from 'share/components/Toaster'
import { ConfirmProvider } from 'share/components/Confirm'
import Toolbar from './components/Toolbar'
import MediaPlayer from './components/MediaPlayer'
import Timeline from './components/Timeline'
import PlaybackBar from './components/PlaybackBar'
import SegmentList from './components/SegmentList'
import store from './store'
import { isMediaFileName, showExportError } from './lib/util'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!store.hasMedia || store.isExporting) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const key = e.key.toLowerCase()
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault()
        store.togglePlay()
      } else if (key === 'arrowleft') {
        e.preventDefault()
        store.seekRel(e.shiftKey ? -0.1 : -1)
      } else if (key === 'arrowright') {
        e.preventDefault()
        store.seekRel(e.shiftKey ? 0.1 : 1)
      } else if (key === 'i') {
        e.preventDefault()
        store.setInPoint()
      } else if (key === 'o') {
        e.preventDefault()
        store.setOutPoint()
      } else if (key === 'e' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        void store.exportSegments().catch((err) => {
          showExportError(err, t)
        })
      } else if (key === 'delete' || key === 'backspace') {
        if (store.activeSegmentId) {
          e.preventDefault()
          store.deleteActiveSegment()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [t])

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
    if (
      !file.type.startsWith('video/') &&
      !file.type.startsWith('audio/') &&
      !isMediaFileName(file.name)
    ) {
      toast.error(t('unsupportedFile'))
      return
    }

    const filePath = tinker.getPathForFile(file)
    if (!filePath) {
      toast.error(t('openFailed'))
      return
    }

    try {
      await store.loadMedia(filePath)
    } catch (err) {
      console.error('Failed to load media:', err)
      toast.error(t('openFailed'))
    }
  }

  return (
    <ToasterProvider>
      <ConfirmProvider>
        <div
          className={`h-screen flex flex-col ${tw.bg.primary}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Toolbar />
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {!store.hasMedia ? (
                <button
                  type="button"
                  className="flex-1 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => {
                    void store.openMediaDialog().catch((err) => {
                      console.error('Failed to open media:', err)
                      toast.error(t('openFailed'))
                    })
                  }}
                >
                  <Film
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
                <>
                  <MediaPlayer />
                  <Timeline />
                  <PlaybackBar />
                </>
              )}
            </div>
            {store.hasMedia && <SegmentList />}
          </div>
        </div>
      </ConfirmProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
