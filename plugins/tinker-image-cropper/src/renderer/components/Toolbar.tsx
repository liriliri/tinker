import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Save,
  X,
  Crop,
  Undo,
  Redo,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react'
import Checkbox from 'share/components/Checkbox'
import Select from 'share/components/Select'
import {
  Toolbar as ToolbarContainer,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { RefObject, useState } from 'react'
import { CropperRef } from 'react-advanced-cropper'
import store from '../store'
import CropSizeDialog from './CropSizeDialog'
import ResizeImageDialog from './ResizeImageDialog'
import ImageResizeIcon from '../assets/image-resize.svg?react'

interface ToolbarProps {
  onCrop?: () => void
  cropperRef?: RefObject<CropperRef>
}

const Toolbar = observer(({ onCrop, cropperRef }: ToolbarProps) => {
  const { t } = useTranslation()
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const [showResizeDialog, setShowResizeDialog] = useState(false)

  const handleOpenImage = async () => {
    try {
      await store.openImageDialog()
    } catch (err) {
      console.error('Failed to open image:', err)
    }
  }

  const handleSaveImage = async () => {
    try {
      await store.saveImage()
    } catch (err) {
      console.error('Failed to save image:', err)
    }
  }

  const handleClear = () => {
    store.clearImage()
  }

  const handleOverwriteChange = (checked: boolean) => {
    store.setOverwriteOriginal(checked)
  }

  const handleRotateLeft = () => {
    if (!cropperRef?.current) return
    cropperRef.current.rotateImage(-90)
  }

  const handleRotateRight = () => {
    if (!cropperRef?.current) return
    cropperRef.current.rotateImage(90)
  }

  const handleFlipHorizontal = () => {
    if (!cropperRef?.current) return
    cropperRef.current.flipImage(true, false)
  }

  const handleFlipVertical = () => {
    if (!cropperRef?.current) return
    cropperRef.current.flipImage(false, true)
  }

  const handleAspectRatioChange = (value: number) => {
    store.setAspectRatio(value === 0 ? null : value)

    // Update crop box size after aspect ratio change
    setTimeout(() => {
      if (!cropperRef?.current) return
      const state = cropperRef.current.getState()
      const { width, height } = state?.coordinates || { width: 0, height: 0 }
      store.setCropBoxSize(width, height)
    }, 0)
  }

  const handleSetCropSize = (width: number, height: number) => {
    if (!cropperRef?.current) return

    const state = cropperRef.current.getState()
    if (!state) return

    const { coordinates } = state
    if (!coordinates) return

    // Set aspect ratio to free when manually setting crop size
    store.setAspectRatio(null)

    // Calculate new coordinates to center the crop box
    const newLeft = coordinates.left + (coordinates.width - width) / 2
    const newTop = coordinates.top + (coordinates.height - height) / 2

    cropperRef.current.setCoordinates({
      left: newLeft,
      top: newTop,
      width,
      height,
    })
  }

  const handleResizeImage = async (width: number, height: number) => {
    if (!store.image) return

    try {
      // Create an image element
      const img = new Image()
      img.src = store.image.originalUrl

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
      })

      // Create canvas and resize
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve)
      })

      if (!blob) return

      const dataUrl = canvas.toDataURL()

      // Update store with resized image
      store.setCroppedImage(blob, dataUrl, width, height)
      store.applyCroppedImage()
    } catch (err) {
      console.error('Failed to resize image:', err)
    }
  }

  return (
    <ToolbarContainer>
      <ToolbarButton onClick={handleOpenImage} title={t('openImage')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleClear}
        disabled={!store.hasImage}
        title={t('clear')}
      >
        <X size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.undo()}
        disabled={!store.canUndo}
        title={t('undo')}
      >
        <Undo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.redo()}
        disabled={!store.canRedo}
        title={t('redo')}
      >
        <Redo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleSaveImage}
        disabled={store.historyIndex <= 0 || store.isSaved}
        title={t('saveImage')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <Checkbox
        checked={store.overwriteOriginal}
        onChange={handleOverwriteChange}
      >
        {t('overwriteOriginal')}
      </Checkbox>

      <ToolbarSpacer />

      {/* Image dimensions info and controls */}
      {store.hasImage && (
        <>
          {/* Crop box dimensions */}
          <button
            className="text-xs px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
            onClick={() => setShowSizeDialog(true)}
            disabled={store.cropBoxWidth <= 0 || store.cropBoxHeight <= 0}
            title={t('setCropSize')}
          >
            {store.cropBoxWidth > 0 && store.cropBoxHeight > 0 ? (
              <div>
                {store.cropBoxWidth} × {store.cropBoxHeight}
              </div>
            ) : (
              <div className="text-gray-400">-</div>
            )}
          </button>

          {/* Aspect Ratio Select */}
          <div className="flex gap-2 items-center">
            <Select
              value={store.aspectRatio ?? 0}
              onChange={handleAspectRatioChange}
              options={[
                { label: t('aspectRatioFree'), value: 0 },
                ...(store.originalAspectRatio
                  ? [
                      {
                        label: t('aspectRatioOriginal'),
                        value: store.originalAspectRatio,
                      },
                    ]
                  : []),
                { label: '1:1', value: 1 },
                { label: '4:3', value: 4 / 3 },
                { label: '3:2', value: 3 / 2 },
                { label: '16:9', value: 16 / 9 },
              ]}
            />
          </div>

          <ToolbarSeparator />

          {/* Rotate and Zoom Controls */}
          <ToolbarButton onClick={handleRotateLeft} title={t('rotateLeft')}>
            <RotateCcw size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarButton onClick={handleRotateRight} title={t('rotateRight')}>
            <RotateCw size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarButton
            onClick={handleFlipHorizontal}
            title={t('flipHorizontal')}
          >
            <FlipHorizontal size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarButton onClick={handleFlipVertical} title={t('flipVertical')}>
            <FlipVertical size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setShowResizeDialog(true)}
            title={t('resizeImage')}
          >
            <ImageResizeIcon
              width={TOOLBAR_ICON_SIZE}
              height={TOOLBAR_ICON_SIZE}
              className="fill-current"
            />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Crop Button */}
          <button
            onClick={onCrop}
            className="px-3 py-1 text-xs bg-[#0fc25e] hover:bg-[#0da84f] text-white font-medium rounded transition-colors flex items-center gap-1.5"
          >
            <Crop size={TOOLBAR_ICON_SIZE} />
            {t('crop')}
          </button>
        </>
      )}

      {/* Crop Size Dialog */}
      <CropSizeDialog
        open={showSizeDialog}
        onClose={() => setShowSizeDialog(false)}
        onConfirm={handleSetCropSize}
        currentWidth={store.cropBoxWidth}
        currentHeight={store.cropBoxHeight}
        maxWidth={store.image?.width || 0}
        maxHeight={store.image?.height || 0}
      />

      {/* Resize Image Dialog */}
      <ResizeImageDialog
        open={showResizeDialog}
        onClose={() => setShowResizeDialog(false)}
        onConfirm={handleResizeImage}
        currentWidth={store.image?.width || 0}
        currentHeight={store.image?.height || 0}
      />
    </ToolbarContainer>
  )
})

export default Toolbar
