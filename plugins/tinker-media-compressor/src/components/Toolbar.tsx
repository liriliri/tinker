import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, ListX, Folder, X, Video, Music } from 'lucide-react'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
  ToolbarLabel,
  ToolbarButtonGroup,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
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
      <ToolbarButtonGroup>
        <ToolbarButton
          variant="toggle"
          active={store.mode === 'video'}
          onClick={() => store.setMode('video')}
          title={t('video')}
          className={`rounded-none rounded-l border-r ${tw.border}`}
        >
          <Video size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          variant="toggle"
          active={store.mode === 'audio'}
          onClick={() => store.setMode('audio')}
          title={t('audio')}
          className="rounded-none rounded-r"
        >
          <Music size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </ToolbarButtonGroup>

      <ToolbarSeparator />

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
      <div
        className="flex items-center w-52 px-1 py-1 text-xs rounded border border-[#e0e0e0] dark:border-[#4a4a4a] bg-white dark:bg-[#2d2d2d] focus-within:ring-1 focus-within:ring-[#0fc25e]"
        title={store.outputDir || t('outputDirPlaceholder')}
      >
        <button
          onClick={handleBrowse}
          title={t('browseOutputDir')}
          className="flex items-center justify-center px-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shrink-0"
        >
          <Folder size={TOOLBAR_ICON_SIZE} />
        </button>
        <input
          type="text"
          value={store.outputDir}
          onChange={(e) => store.setOutputDir(e.target.value)}
          placeholder={t('outputDirPlaceholder')}
          className="flex-1 min-w-0 mx-1 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        {store.outputDir && (
          <button
            onClick={() => store.setOutputDir('')}
            title={t('clearOutputDir')}
            className="flex items-center justify-center px-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shrink-0"
          >
            <X size={TOOLBAR_ICON_SIZE} />
          </button>
        )}
      </div>

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
