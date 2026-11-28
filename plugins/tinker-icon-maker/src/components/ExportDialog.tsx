import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import toNum from 'licia/toNum'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import { PLATFORM_SPECS } from '../lib/presets'
import store from '../store'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
}

const ExportDialog = observer(function ExportDialog({
  open,
  onClose,
}: ExportDialogProps) {
  const { t } = useTranslation()
  const exportAsZip = !isEmpty(store.selectedPlatforms)

  const handleExport = async () => {
    if (await store.export()) onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('exportTitle')}
      showClose
      className="w-full max-w-sm"
    >
      <div className="space-y-5">
        <div>
          <div className={`mb-2 text-xs font-medium ${tw.text.secondary}`}>
            {t('exportSingle')}
          </div>
          <Select
            className="w-full"
            value={String(store.singleExportSize)}
            options={store.exportSizeOptions}
            onChange={(value) => store.setSingleExportSize(toNum(value))}
            disabled={exportAsZip}
          />
        </div>

        <div>
          <div className={`mb-2 text-xs font-medium ${tw.text.secondary}`}>
            {t('exportPlatforms')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {map(PLATFORM_SPECS, (spec) => {
              const selected = store.isPlatformSelected(spec.id)
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => store.togglePlatform(spec.id)}
                  className={className(
                    'rounded-lg border px-3 py-3 text-left transition-colors',
                    selected && tw.primary.border,
                    selected && tw.primary.bgFocused,
                    !selected && tw.border,
                    !selected && tw.bg.primary,
                    !selected && tw.hover
                  )}
                >
                  <div
                    className={className(
                      'text-sm font-medium',
                      selected ? tw.primary.text : tw.text.primary
                    )}
                  >
                    {t(spec.nameKey)}
                  </div>
                  <div className={`mt-0.5 text-[11px] ${tw.text.secondary}`}>
                    {t('sizeCount', { count: spec.sizes.length })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <DialogButton
            onClick={handleExport}
            disabled={!store.hasSource || store.isExporting}
          >
            {store.isExporting ? t('exporting') : t('export')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})

export default ExportDialog
