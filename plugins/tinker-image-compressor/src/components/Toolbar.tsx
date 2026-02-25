import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save, ListX } from 'lucide-react'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
  ToolbarLabel,
} from 'share/components/Toolbar'
import store from '../store'

const QUALITY_LEVELS = [
  { label: 'qualityVeryLow', value: 20 },
  { label: 'qualityLow', value: 40 },
  { label: 'qualityMedium', value: 60 },
  { label: 'qualityHigh', value: 80 },
  { label: 'qualityExcellent', value: 95 },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleQualityChange = (value: number) => {
    store.setQuality(value)
  }

  const qualityOptions = QUALITY_LEVELS.map((level) => ({
    label: t(level.label),
    value: level.value,
  }))

  const handleOverwriteChange = (checked: boolean) => {
    store.setOverwriteOriginal(checked)
  }

  const handleCompress = async () => {
    await store.compressAll()
  }

  const handleOpenImage = async () => {
    await store.openImageDialog()
  }

  const handleSaveImage = async () => {
    await store.saveAll()
  }

  const handleClear = () => {
    store.clear()
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleOpenImage} title={t('openImage')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleClear}
        disabled={!store.hasImages}
        title={t('clear')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleSaveImage}
        disabled={!store.hasUnsaved}
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

      {store.hasImages && (
        <>
          <Checkbox
            checked={store.keepExif}
            onChange={(checked) => store.setKeepExif(checked)}
          >
            {t('keepExif')}
          </Checkbox>

          <ToolbarSeparator />

          <div className="flex gap-2 items-center">
            <ToolbarLabel>{`${t('quality')}:`}</ToolbarLabel>
            <Select
              value={store.quality}
              onChange={handleQualityChange}
              options={qualityOptions}
              disabled={store.isCompressing}
            />
          </div>

          <ToolbarSeparator />

          <ToolbarTextButton
            onClick={handleCompress}
            disabled={store.isCompressing || !store.hasUncompressed}
          >
            {t('compress')}
          </ToolbarTextButton>
        </>
      )}
    </Toolbar>
  )
})
