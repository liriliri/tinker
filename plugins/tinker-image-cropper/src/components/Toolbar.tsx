import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Save,
  Copy,
  Check,
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
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import { RefObject, useState } from 'react'
import { CropperRef } from 'react-advanced-cropper'
import className from 'licia/className'
import delay from 'licia/delay'
import startWith from 'licia/startWith'
import store from '../store'
import CropSizeDialog from './CropSizeDialog'
import ResizeImageDialog from './ResizeImageDialog'
import ImageResizeIcon from '../assets/image-resize.svg?react'
import { resizeImageOnCanvas } from '../lib/util'

interface ToolbarProps {
  onCrop?: () => void
  cropperRef?: RefObject<CropperRef | null>
}

export default observer(function ToolbarComponent({
  onCrop,
  cropperRef,
}: ToolbarProps) {
  const { t } = useTranslation()
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const [showResizeDialog, setShowResizeDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const captureScreenToFile = async (): Promise<File | null> => {
    const dataUrl = await tinker.captureScreen()
    if (!dataUrl) return null

    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      return new File([blob], 'screenshot.png', { type: 'image/png' })
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      return null
    }
  }

  const pasteImageFromClipboard = async (): Promise<File | null> => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (startWith(type, 'image/')) {
            const blob = await item.getType(type)
            return new File([blob], 'clipboard.png', { type })
          }
        }
      }
      return null
    } catch (error) {
      console.error('Failed to paste image from clipboard:', error)
      return null
    }
  }

  const handleOpenImage = async () => {
    try {
      await store.openImageDialog()
    } catch (err) {
      console.error('Failed to open image:', err)
    }
  }

  const handleCaptureScreen = async () => {
    const file = await captureScreenToFile()
    if (file) {
      await store.loadImage(file)
    }
  }

  const handlePasteImage = async () => {
    const file = await pasteImageFromClipboard()
    if (file) {
      await store.loadImage(file)
    }
  }

  const handleSaveImage = async () => {
    try {
      await store.saveImage()
    } catch (err) {
      console.error('Failed to save image:', err)
    }
  }

  const handleCopyImage = async () => {
    try {
      await store.copyImage()
      setCopied(true)
      delay(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy image:', err)
    }
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

    store.setAspectRatio(null)

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
      store.applyCanvasResult(
        await resizeImageOnCanvas(store.image.originalUrl, width, height)
      )
    } catch (err) {
      console.error('Failed to resize image:', err)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleOpenImage}
        menu={[
          {
            label: t('captureScreen'),
            click: () => handleCaptureScreen(),
          },
          {
            label: t('pasteImage'),
            click: () => handlePasteImage(),
          },
        ]}
        title={t('openImage')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
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
        onClick={handleCopyImage}
        disabled={store.historyIndex <= 0}
        className={className(copied && tw.primary.text)}
        title={t('copyImage')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

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

      {store.hasImage && (
        <>
          <ToolbarButton
            onClick={() => setShowSizeDialog(true)}
            disabled={store.cropBoxWidth <= 0 || store.cropBoxHeight <= 0}
            title={t('setCropSize')}
          >
            {store.cropBoxWidth > 0 && store.cropBoxHeight > 0
              ? `${store.cropBoxWidth} × ${store.cropBoxHeight}`
              : '-'}
          </ToolbarButton>

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

          <ToolbarTextButton onClick={onCrop}>
            <div className="flex items-center gap-1.5">
              <Crop size={TOOLBAR_ICON_SIZE} />
              {t('crop')}
            </div>
          </ToolbarTextButton>
        </>
      )}

      <CropSizeDialog
        open={showSizeDialog}
        onClose={() => setShowSizeDialog(false)}
        onConfirm={handleSetCropSize}
        currentWidth={store.cropBoxWidth}
        currentHeight={store.cropBoxHeight}
        maxWidth={store.image?.width || 0}
        maxHeight={store.image?.height || 0}
      />

      <ResizeImageDialog
        open={showResizeDialog}
        onClose={() => setShowResizeDialog(false)}
        onConfirm={handleResizeImage}
        currentWidth={store.image?.width || 0}
        currentHeight={store.image?.height || 0}
      />
    </Toolbar>
  )
})
