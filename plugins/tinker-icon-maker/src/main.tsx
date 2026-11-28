import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { type DragEvent } from 'react'
import { tw } from 'share/theme'
import ImageOpen from 'share/components/ImageOpen'
import { ToasterProvider } from 'share/components/Toaster'
import renderApp from 'share/lib/renderApp'
import store from './store'
import Preview from './components/Preview'
import Sidebar from './components/Sidebar'
import { firstDroppedImage } from './lib/util'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = firstDroppedImage(e.dataTransfer.files)
    if (!file) return
    await store.loadDroppedFile(file)
  }

  return (
    <ToasterProvider>
      <div
        className={`h-screen w-screen flex flex-col overflow-hidden ${tw.bg.primary}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={`border-t ${tw.border}`} />
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col relative">
            {!store.hasSource ? (
              <ImageOpen
                onOpenImage={() => store.openImageDialog()}
                openTitle={t('openTitle')}
                supportedFormats={t('supportedFormats')}
              />
            ) : (
              <Preview />
            )}
          </div>
        </div>
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
