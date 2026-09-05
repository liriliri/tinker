import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Folder, Scissors, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Checkbox from 'share/components/Checkbox'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'
import { showExportError } from '../lib/util'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const busy = store.isExporting

  const handleOpen = async () => {
    try {
      await store.openMediaDialog()
    } catch (err) {
      console.error('Failed to open media:', err)
      toast.error(t('openFailed'))
    }
  }

  const handleExport = async () => {
    try {
      const outputs = await store.exportSegments()
      if (outputs && outputs.length > 0) {
        toast.success(t('exportSuccess', { count: outputs.length }))
      }
    } catch (err) {
      showExportError(err, t)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleOpen}
        disabled={busy}
        title={t('openMedia')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <div
        className={`flex items-center w-52 px-1 py-1 text-xs rounded border ${tw.border} ${tw.bg.input} focus-within:ring-1 ${tw.primary.focusRing}`}
        title={store.outputDir || t('outputDirPlaceholder')}
      >
        <button
          type="button"
          onClick={() => {
            void store.browseOutputDir()
          }}
          disabled={busy}
          title={t('browseOutputDir')}
          className="flex items-center justify-center px-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shrink-0 disabled:opacity-40"
        >
          <Folder size={TOOLBAR_ICON_SIZE} />
        </button>
        <input
          type="text"
          value={store.outputDir}
          onChange={(e) => store.setOutputDir(e.target.value)}
          disabled={busy}
          placeholder={t('outputDirPlaceholder')}
          className="flex-1 min-w-0 mx-1 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-40"
        />
        {store.outputDir && (
          <button
            type="button"
            onClick={() => store.setOutputDir('')}
            disabled={busy}
            title={t('clearOutputDir')}
            className="flex items-center justify-center px-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 shrink-0 disabled:opacity-40"
          >
            <X size={TOOLBAR_ICON_SIZE} />
          </button>
        )}
      </div>

      {busy && (
        <span className={`text-xs tabular-nums ml-2 ${tw.text.secondary}`}>
          {store.exportIndex}/{store.exportTotal} · {store.progress}%
        </span>
      )}

      <ToolbarSpacer />

      {store.hasMedia && (
        <>
          <div className="px-1">
            <Checkbox
              checked={store.keyframeCut}
              onChange={(checked) => store.setKeyframeCut(checked)}
              disabled={busy}
            >
              <span className={`text-xs ${tw.text.secondary}`}>
                {t('keyframeCut')}
              </span>
            </Checkbox>
          </div>

          <ToolbarSeparator />

          {busy ? (
            <ToolbarTextButton onClick={() => store.cancelExport()}>
              <div className="flex items-center gap-1.5">
                <X size={TOOLBAR_ICON_SIZE} />
                {t('cancel')}
              </div>
            </ToolbarTextButton>
          ) : (
            <ToolbarTextButton
              onClick={handleExport}
              disabled={store.exportableCount === 0}
            >
              <div className="flex items-center gap-1.5">
                <Scissors size={TOOLBAR_ICON_SIZE} />
                {t('export')}
              </div>
            </ToolbarTextButton>
          )}
        </>
      )}
    </Toolbar>
  )
})
