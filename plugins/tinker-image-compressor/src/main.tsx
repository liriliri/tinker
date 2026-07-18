import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ImageOpen from 'share/components/ImageOpen'
import ImageList from './components/ImageList'
import CompareModal from './components/CompareModal'
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

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )
    if (imageFiles.length === 0) {
      return
    }

    try {
      const fileArray = imageFiles.map((file) => {
        const filePath = tinker.getPathForFile(file) || undefined
        return { file, filePath }
      })
      await store.loadImages(fileArray)
    } catch {
      // loadImages handles errors internally
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
        {!store.hasImages ? (
          <ImageOpen
            onOpenImage={() => store.openImageDialog()}
            openTitle={t('openTitle')}
            supportedFormats={t('supportedFormats')}
          />
        ) : (
          <ImageList />
        )}
      </div>

      <CompareModal />
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
