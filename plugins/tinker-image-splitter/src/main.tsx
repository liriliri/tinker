import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import ImageOpen from 'share/components/ImageOpen'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import SplitCanvas from './components/SplitCanvas'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

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
    <div
      className={`h-screen flex flex-col ${tw.bg.primary}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!store.hasImage ? (
          <ImageOpen
            onOpenImage={() => store.openImageDialog()}
            openTitle={t('openTitle')}
            supportedFormats={t('supportedFormats')}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <SplitCanvas />
          </div>
        )}
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
