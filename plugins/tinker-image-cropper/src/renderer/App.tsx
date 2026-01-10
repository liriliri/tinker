import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { CropperRef } from 'react-advanced-cropper'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ImageOpen from 'share/components/ImageOpen'
import ImageCropper from './components/ImageCropper'
import store from './store'

export default observer(function App() {
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

    // Only take the first file
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      console.warn('Only image files are supported')
      return
    }

    try {
      // In Electron, the File object has a path property
      const filePath = (file as any).path
      await store.loadImage(file, filePath)
    } catch (err) {
      console.error('Failed to load image:', err)
    }
  }

  const handleCrop = () => {
    const cropper = cropperRef.current
    if (!cropper) return

    const canvas = cropper.getCanvas()
    if (!canvas) return

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const dataUrl = canvas.toDataURL()
        store.setCroppedImage(blob, dataUrl, canvas.width, canvas.height)
        // Apply cropped image as new original
        store.applyCroppedImage()
      }
    })
  }

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar onCrop={handleCrop} cropperRef={cropperRef} />

      {/* Main Content */}
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
