import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, ListX, Folder, X, Video, Music, Image } from 'lucide-react'
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

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const formatOptions = store.outputFormatOptions.map((fmt) => ({
    label: fmt.toUpperCase(),
    value: fmt,
  }))

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
          className={`rounded-none border-r ${tw.border}`}
        >
          <Music size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          variant="toggle"
          active={store.mode === 'image'}
          onClick={() => store.setMode('image')}
          title={t('image')}
          className="rounded-none rounded-r"
        >
          <Image size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </ToolbarButtonGroup>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.openMediaDialog()}
        disabled={store.isConverting}
        title={t('openFile')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.clear()}
        disabled={!store.hasItems || store.isConverting}
        title={t('clear')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <div
        className={`flex items-center w-52 px-1 py-1 text-xs rounded border ${tw.border} ${tw.bg.input} focus-within:ring-1 ${tw.primary.focusRing}`}
        title={store.outputDir || t('outputDirPlaceholder')}
      >
        <button
          onClick={() => store.browseOutputDir()}
          title={t('browseOutputDir')}
          className={`flex items-center justify-center px-0.5 ${tw.text.tertiary} hover:${tw.text.primary} shrink-0`}
        >
          <Folder size={TOOLBAR_ICON_SIZE} />
        </button>
        <input
          type="text"
          value={store.outputDir}
          onChange={(e) => store.setOutputDir(e.target.value)}
          placeholder={t('outputDirPlaceholder')}
          className={`flex-1 min-w-0 mx-1 bg-transparent ${tw.text.primary} focus:outline-none placeholder:${tw.text.tertiary}`}
        />
        {store.outputDir && (
          <button
            onClick={() => store.setOutputDir('')}
            title={t('clearOutputDir')}
            className={`flex items-center justify-center px-0.5 ${tw.text.tertiary} hover:${tw.text.primary} shrink-0`}
          >
            <X size={TOOLBAR_ICON_SIZE} />
          </button>
        )}
      </div>

      <ToolbarSpacer />

      {store.hasItems && (
        <>
          <div className="flex gap-2 items-center">
            <ToolbarLabel>{`${t('outputFormat')}:`}</ToolbarLabel>
            <Select
              value={store.outputFormat}
              onChange={(v) => store.setOutputFormat(v)}
              options={formatOptions}
              disabled={store.isConverting}
              className="w-24"
            />
          </div>

          <ToolbarSeparator />

          <ToolbarTextButton
            variant={store.isConverting ? 'secondary' : 'primary'}
            onClick={() =>
              store.isConverting ? store.cancelConversion() : store.convertAll()
            }
            disabled={!store.isConverting && !store.hasUnconverted}
          >
            {store.isConverting ? t('cancel') : t('convert')}
          </ToolbarTextButton>
        </>
      )}
    </Toolbar>
  )
})
