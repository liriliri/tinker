import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import find from 'licia/find'
import Dialog, { DialogButton } from 'share/components/Dialog'
import MermaidDiagram, {
  type MermaidDiagramStatus,
} from 'share/components/MermaidDiagram'
import { tw } from 'share/theme'
import store from '../store'
import { getDiagramBackground } from '../lib/mermaid'
import { SAMPLE_DIAGRAMS } from '../lib/samples'
import RenderingBadge from './RenderingBadge'

interface SampleDialogProps {
  open: boolean
  onClose: () => void
}

export default observer(function SampleDialog({
  open,
  onClose,
}: SampleDialogProps) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState(SAMPLE_DIAGRAMS[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected =
    find(SAMPLE_DIAGRAMS, (sample) => sample.id === selectedId) ??
    SAMPLE_DIAGRAMS[0]

  useEffect(() => {
    if (open) {
      setSelectedId(SAMPLE_DIAGRAMS[0]?.id ?? '')
      setError(null)
      setLoading(false)
    }
  }, [open])

  const handleStatusChange = (status: MermaidDiagramStatus) => {
    setLoading(status.loading)
    setError(status.error)
  }

  const handleConfirm = () => {
    if (!selected) return
    store.setCodeInput(selected.code)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('samples')}
      className="w-full max-w-2xl"
    >
      <div className="flex gap-4 h-[300px] min-h-0">
        <div
          className={`w-40 shrink-0 overflow-y-auto rounded border ${tw.border} ${tw.bg.primary}`}
        >
          {SAMPLE_DIAGRAMS.map((sample) => {
            const active = sample.id === selected?.id
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => setSelectedId(sample.id)}
                className={className(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  active
                    ? `${tw.primary.bgFocused} ${tw.primary.text}`
                    : `${tw.text.primary} ${tw.hover}`
                )}
              >
                {sample.name}
              </button>
            )
          })}
        </div>

        <div
          className={`relative flex-1 min-w-0 overflow-hidden rounded border ${tw.border}`}
          style={{ backgroundColor: getDiagramBackground(store.isDark) }}
        >
          {loading && <RenderingBadge />}

          {open && selected && (
            <div className={error ? 'h-full w-full' : 'h-full w-full p-4'}>
              <MermaidDiagram
                source={selected.code}
                isDark={store.isDark}
                debounceMs={200}
                errorDisplay="error"
                hideLoading
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <div className={`text-xs truncate ${tw.text.tertiary}`}>
          {selected?.title}
        </div>
        <div className="flex gap-2 shrink-0">
          <DialogButton variant="text" onClick={onClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleConfirm} disabled={!selected || !!error}>
            {t('confirm')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
