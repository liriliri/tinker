import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ImageOpen from 'share/components/ImageOpen'
import ImageList from './components/ImageList'
import CompareModal from './components/CompareModal'
import store from './store'

export default observer(function App() {
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

    // Filter image files only
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )
    if (imageFiles.length === 0) {
      console.warn('Only image files are supported')
      return
    }

    try {
      const fileArray = imageFiles.map((file) => {
        // In Electron, the File object has a path property
        const filePath = (file as any).path
        return { file, filePath }
      })
      await store.loadImages(fileArray)
    } catch (err) {
      console.error('Failed to load images:', err)
    }
  }

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar />

      {/* Main Content */}
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

      {/* Compare Modal */}
      <CompareModal />
    </div>
  )
})
