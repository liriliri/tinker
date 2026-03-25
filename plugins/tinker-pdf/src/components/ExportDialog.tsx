import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Slider from 'share/components/Slider'
import { tw } from 'share/theme'

interface ExportDialogProps {
  open: boolean
  exportProgress: { current: number; total: number } | null
  onConfirm: (scale: number) => void
  onCancel: () => void
}

const PRESETS = [
  { label: '1x', val: 1 },
  { label: '2x', val: 2 },
  { label: '3x', val: 3 },
  { label: '4x', val: 4 },
]

// Slider works in integer steps; map 50–400 → 0.5x–4.0x
const toPercent = (scale: number) => Math.round(scale * 100)
const toScale = (percent: number) => percent / 100

export default function ExportDialog({
  open,
  exportProgress,
  onConfirm,
  onCancel,
}: ExportDialogProps) {
  const { t } = useTranslation()
  const [percent, setPercent] = useState(200)

  const isExporting = !!exportProgress

  const handleConfirm = () => {
    onConfirm(toScale(percent))
  }

  return (
    <Dialog open={open} onClose={onCancel} title={t('exportDialogTitle')}>
      <div className="mb-4">
        <div className={`text-sm mb-3 ${tw.text.primary}`}>
          {t('scale')}: {toScale(percent).toFixed(1)}x
        </div>
        <Slider
          min={50}
          max={400}
          value={percent}
          onChange={setPercent}
          disabled={isExporting}
        />
        <div
          className={`flex justify-between text-xs mt-1 ${tw.text.tertiary}`}
        >
          <span>0.5x</span>
          <span>4.0x</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPercent(toPercent(p.val))}
            disabled={isExporting}
            className={`px-2 py-1 text-xs rounded ${tw.bg.tertiary} ${tw.hover} ${tw.text.secondary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-end items-center">
        {exportProgress && (
          <span
            className={`text-xs tabular-nums ${tw.text.secondary} mr-auto inline-flex items-center`}
          >
            <span
              className="inline-block text-right"
              style={{
                width: `${String(exportProgress.total).length}ch`,
              }}
            >
              {exportProgress.current}
            </span>
            <span>/</span>
            <span>{exportProgress.total}</span>
          </span>
        )}
        <DialogButton variant="text" onClick={onCancel} disabled={isExporting}>
          {t('cancel')}
        </DialogButton>
        <DialogButton onClick={handleConfirm} disabled={isExporting}>
          {t('export')}
        </DialogButton>
      </div>
    </Dialog>
  )
}
