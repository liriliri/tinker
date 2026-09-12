import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { CropperRef } from 'react-advanced-cropper'
import { useTranslation } from 'react-i18next'
import startWith from 'licia/startWith'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ImageOpen from 'share/components/ImageOpen'
import ImageCropper from './components/ImageCropper'
import store from './store'
import renderApp from 'share/lib/renderApp'
import { exportCanvas, HIGH_QUALITY_DRAW_OPTIONS } from './lib/util'
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

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!startWith(file.type, 'image/')) {
      console.warn('Only image files are supported')
      return
    }

    try {
      const filePath = tinker.getPathForFile(file) || undefined
      await store.loadImage(file, filePath)
    } catch (err) {
      console.error('Failed to load image:', err)
    }
  }

  const handleCrop = async () => {
    const cropper = cropperRef.current
    if (!cropper) return

    const canvas = cropper.getCanvas(HIGH_QUALITY_DRAW_OPTIONS)
    if (!canvas) return

    try {
      store.applyCanvasResult(await exportCanvas(canvas))
    } catch (err) {
      console.error('Failed to crop image:', err)
    }
  }

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.primary}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar onCrop={handleCrop} cropperRef={cropperRef} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!store.hasImage ? (
          <ImageOpen
            onOpenImage={() => store.openImageDialog()}
            openTitle={t('openTitle')}
            supportedFormats={t('supportedFormats')}
          />
        ) : (
          <ImageCropper cropperRef={cropperRef} />
        )}
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
