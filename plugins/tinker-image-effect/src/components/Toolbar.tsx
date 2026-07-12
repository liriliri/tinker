import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save } from 'lucide-react'
import Checkbox from 'share/components/Checkbox'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import store from '../store'
import { EFFECTS, type EffectId } from '../types'

const ToolbarComponent = observer(function ToolbarComponent() {
  const { t, i18n } = useTranslation()

  const effectOptions = useMemo(
    () =>
      EFFECTS.map((effect) => ({
        value: effect.id,
        label: t(effect.nameKey),
      })),
    [t, i18n.language]
  )

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

      <Select<EffectId>
        className="w-24"
        value={store.effectId}
        onChange={(value) => store.setEffect(value)}
        options={effectOptions}
      />
    </Toolbar>
  )
})

export default ToolbarComponent
