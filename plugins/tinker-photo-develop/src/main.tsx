import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import ImageOpen from 'share/components/ImageOpen'
import store from './store'
import Toolbar from './components/Toolbar'
import ImagePreview from './components/ImagePreview'
import AdjustPanel from './components/AdjustPanel'
import { ToasterProvider } from 'share/components/Toaster'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!store.hasImage) return

      const target = event.target
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA')

      if (!(event.metaKey || event.ctrlKey) || isEditableTarget) return

      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          store.redo()
        } else {
          store.undo()
        }
        return
      }

      if (key === 'y') {
        event.preventDefault()
        store.redo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      console.warn('Only image files are supported')
      return
    }

    try {
      const filePath = (file as File & { path?: string }).path
      await store.loadImage(file, filePath)
    } catch (err) {
      console.error('Failed to load image:', err)
    }
  }

  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col ${tw.bg.primary}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Toolbar />

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
            {!store.hasImage && !store.isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col">
                <ImageOpen
                  onOpenImage={() => store.openImageDialog()}
                  openTitle={t('openTitle')}
                  supportedFormats={t('supportedFormats')}
                />
              </div>
            )}

            <div className="flex-1">
              <ImagePreview />
            </div>
          </div>

          {store.hasImage && (
            <div
              className={`w-72 shrink-0 overflow-hidden border-l ${tw.border} ${tw.bg.tertiary}`}
            >
              <AdjustPanel />
            </div>
          )}
        </div>
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
