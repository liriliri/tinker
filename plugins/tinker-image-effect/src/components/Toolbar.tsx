import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, RotateCcw, Save } from 'lucide-react'
import Checkbox from 'share/components/Checkbox'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarLabel,
} from 'share/components/Toolbar'
import store from '../store'

const ToolbarComponent = observer(function ToolbarComponent() {
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

  return (
    <Toolbar>
      <ToolbarButton onClick={handleOpenImage} title={t('openImage')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleSaveImage}
        disabled={!store.hasImage || !store.hasChanges || store.isSaved}
        title={t('saveImage')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <Checkbox
        checked={store.overwriteOriginal}
        onChange={(checked) => store.setOverwriteOriginal(checked)}
        disabled={!store.hasImage || !store.image?.filePath}
      >
        {t('overwriteOriginal')}
      </Checkbox>

      <ToolbarSpacer />

      {store.hasImage && store.image && (
        <ToolbarLabel className="tabular-nums">
          {`${store.image.width} × ${store.image.height}`}
        </ToolbarLabel>
      )}

      <ToolbarButton
        onClick={() => store.resetEffect()}
        disabled={!store.hasImage || !store.hasChanges}
        title={t('resetEffect')}
      >
        <RotateCcw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})

export default ToolbarComponent
