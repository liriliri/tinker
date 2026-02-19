import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, ListX, Folder, X } from 'lucide-react'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
  ToolbarLabel,
  ToolbarTextInput,
} from 'share/components/Toolbar'
import store from '../store'

const QUALITY_LEVELS = [
  { label: 'qualityVeryLow', value: 0 },
  { label: 'qualityLow', value: 1 },
  { label: 'qualityMedium', value: 2 },
  { label: 'qualityHigh', value: 3 },
  { label: 'qualityExcellent', value: 4 },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const qualityOptions = QUALITY_LEVELS.map((level) => ({
    label: t(level.label),
    value: level.value,
  }))

  const handleOpen = async () => {
    await store.openMediaDialog()
  }

  const handleClear = () => {
    store.clear()
  }

  const handleBrowse = async () => {
    await store.browseOutputDir()
  }

  const handleCompress = async () => {
    await store.compressAll()
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleOpen} title={t('openFile')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleClear}
        disabled={!store.hasItems}
        title={t('clear')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Output directory */}
      <ToolbarLabel>{`${t('outputDir')}:`}</ToolbarLabel>
      <ToolbarTextInput
        value={store.outputDir}
        onChange={(e) => store.setOutputDir(e.target.value)}
        placeholder={t('outputDirPlaceholder')}
        className="w-44"
        title={store.outputDir || t('outputDirPlaceholder')}
      />
      {store.outputDir && (
        <ToolbarButton
          onClick={() => store.setOutputDir('')}
          title={t('clearOutputDir')}
        >
          <X size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      )}
      <ToolbarButton onClick={handleBrowse} title={t('browseOutputDir')}>
        <Folder size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      {store.hasItems && (
        <>
          <div className="flex gap-2 items-center">
            <ToolbarLabel>{`${t('quality')}:`}</ToolbarLabel>
            <Select
              value={store.quality}
              onChange={(v) => store.setQuality(v)}
              options={qualityOptions}
              disabled={store.isCompressing}
            />
          </div>

          <ToolbarSeparator />

          <ToolbarTextButton
            onClick={handleCompress}
            disabled={store.isCompressing || !store.hasUncompressed}
          >
            {store.isCompressing ? t('compressing') : t('compress')}
          </ToolbarTextButton>
        </>
      )}
    </Toolbar>
  )
})
