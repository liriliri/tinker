import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save, X, Crop, Undo, Redo } from 'lucide-react'
import Checkbox from 'share/components/Checkbox'
import Select from 'share/components/Select'
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

  const handleOverwriteChange = (checked: boolean) => {
    store.setOverwriteOriginal(checked)
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
          <div className="text-xs">
            {store.cropBoxWidth > 0 && store.cropBoxHeight > 0 ? (
              <div>
                {store.cropBoxWidth} × {store.cropBoxHeight}
              </div>
            ) : (
              <div className="text-gray-400">-</div>
            )}
          </div>

          <ToolbarSeparator />

          {/* Aspect Ratio Select */}
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {t('aspectRatio')}:
            </label>
            <Select
              value={store.aspectRatio ?? 0}
              onChange={(value) =>
                store.setAspectRatio(value === 0 ? null : value)
              }
              options={[
                { label: t('aspectRatioFree'), value: 0 },
                { label: '1:1', value: 1 },
                { label: '4:3', value: 4 / 3 },
                { label: '16:9', value: 16 / 9 },
                { label: '3:4', value: 3 / 4 },
                { label: '9:16', value: 9 / 16 },
              ]}
            />
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
