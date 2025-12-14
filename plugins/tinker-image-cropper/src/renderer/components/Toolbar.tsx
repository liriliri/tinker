import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save, X, Crop } from 'lucide-react'
import {
  Toolbar as ToolbarContainer,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import store from '../store'

interface ToolbarProps {
  onCrop?: () => void
}

const Toolbar = observer(({ onCrop }: ToolbarProps) => {
  const { t } = useTranslation()

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
        onClick={handleSaveImage}
        disabled={!store.hasCropped}
        title={t('saveImage')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      {/* Image dimensions info */}
      {store.hasImage && (
        <>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-[#6e6e6e] dark:text-[#8a8a8a]">
                {t('originalSize')}:
              </span>
              <span className="ml-2">
                {store.image!.width} × {store.image!.height}
              </span>
            </div>
            {store.croppedWidth > 0 && store.croppedHeight > 0 && (
              <div>
                <span className="text-[#6e6e6e] dark:text-[#8a8a8a]">
                  {t('croppedSize')}:
                </span>
                <span className="ml-2">
                  {store.croppedWidth} × {store.croppedHeight}
                </span>
              </div>
            )}
          </div>

          <ToolbarSeparator />

          {/* Crop Button */}
          <button
            onClick={onCrop}
            disabled={!store.hasImage}
            className="px-3 py-1 text-xs bg-[#0fc25e] hover:bg-[#0da84f] disabled:bg-[#8a8a8a] disabled:cursor-not-allowed text-white font-medium rounded transition-colors flex items-center gap-1.5"
          >
            <Crop size={TOOLBAR_ICON_SIZE} />
            {t('crop')}
          </button>
        </>
      )}
    </ToolbarContainer>
  )
})

export default Toolbar
