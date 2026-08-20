import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Crop } from 'lucide-react'
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
import toast from 'react-hot-toast'
import store from '../store'
import CropSizeDialog from './CropSizeDialog'

interface ToolbarProps {
  cropperRef: RefObject<CropperRef | null>
}

export default observer(function ToolbarComponent({
  cropperRef,
}: ToolbarProps) {
  const { t } = useTranslation()
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const busy = store.isExporting

  const handleOpenVideo = async () => {
    try {
      await store.openVideoDialog()
    } catch (err) {
      console.error('Failed to open video:', err)
      toast.error(t('openFailed'))
    }
  }

  const handleCrop = async () => {
    try {
      await store.exportVideo()
    } catch (err) {
      console.error('Failed to export video:', err)
      toast.error(t('exportFailed'))
    }
  }

  const handleAspectRatioChange = (value: number) => {
    store.setAspectRatio(value === 0 ? null : value)

    setTimeout(() => {
      const cropper = cropperRef.current
      if (!cropper) return
      const coordinates = cropper.getCoordinates()
      if (!coordinates) return
      store.setCropBox({
        x: coordinates.left,
        y: coordinates.top,
        width: coordinates.width,
        height: coordinates.height,
      })
    }, 0)
  }

  const handleSetCropSize = (width: number, height: number) => {
    const cropper = cropperRef.current
    if (!cropper) return

    const coordinates = cropper.getCoordinates()
    if (!coordinates) return

    store.setAspectRatio(null)

    cropper.setCoordinates({
      left: coordinates.left + (coordinates.width - width) / 2,
      top: coordinates.top + (coordinates.height - height) / 2,
      width,
      height,
    })
  }

  const aspectRatioOptions = [
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
  ]

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleOpenVideo}
        disabled={busy}
        title={t('openVideo')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      {busy && (
        <span className={`text-xs tabular-nums ${tw.text.secondary}`}>
          {store.progress}%
        </span>
      )}

      <ToolbarSpacer />

      {store.hasVideo && (
        <>
          <ToolbarButton
            onClick={() => setShowSizeDialog(true)}
            disabled={busy}
            title={t('setCropSize')}
          >
            {store.cropBoxWidth} × {store.cropBoxHeight}
          </ToolbarButton>

          <Select
            value={store.aspectRatio ?? 0}
            onChange={handleAspectRatioChange}
            disabled={busy}
            options={aspectRatioOptions}
          />

          <ToolbarSeparator />

          <ToolbarTextButton onClick={handleCrop} disabled={busy}>
            <div className="flex items-center gap-1.5">
              <Crop size={TOOLBAR_ICON_SIZE} />
              {t('crop')}
            </div>
          </ToolbarTextButton>
        </>
      )}

      <CropSizeDialog
        open={showSizeDialog && !busy}
        onClose={() => setShowSizeDialog(false)}
        onConfirm={handleSetCropSize}
        currentWidth={store.cropBoxWidth}
        currentHeight={store.cropBoxHeight}
        maxWidth={store.video?.width || 0}
        maxHeight={store.video?.height || 0}
      />
    </Toolbar>
  )
})
