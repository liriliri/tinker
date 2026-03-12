import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Slider from 'share/components/Slider'
import { tw } from 'share/theme'

interface SpeedDialogProps {
  open: boolean
  onConfirm: (rate: number) => void
  onCancel: () => void
}

const PRESETS = [
  { labelKey: 'speedPresetALotSlower', val: 0.65 },
  { labelKey: 'speedPresetSlower', val: 0.85 },
  { labelKey: 'speedPresetFaster', val: 1.15 },
  { labelKey: 'speedPresetBlazingFast', val: 1.4 },
]

// Slider works in integer steps; map 20–200 → 0.20x–2.00x
const toPercent = (rate: number) => Math.round(rate * 100)
const toRate = (percent: number) => percent / 100

export default function SpeedDialog({
  open,
  onConfirm,
  onCancel,
}: SpeedDialogProps) {
  const { t } = useTranslation()
  const [percent, setPercent] = useState(100)

  const handleConfirm = () => {
    onConfirm(toRate(percent))
  }

  return (
    <Dialog open={open} onClose={onCancel} title={t('speed')}>
      <div className="mb-4">
        <div className={`text-sm mb-3 ${tw.text.primary}`}>
          {t('speedRate')}: {toRate(percent).toFixed(2)}x
        </div>
        <Slider min={20} max={200} value={percent} onChange={setPercent} />
        <div
          className={`flex justify-between text-xs mt-1 ${tw.text.tertiary}`}
        >
          <span>0.20x</span>
          <span>2.00x</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.labelKey}
            onClick={() => setPercent(toPercent(p.val))}
            className={`px-2 py-1 text-xs rounded ${tw.bg.tertiary} ${tw.hover} ${tw.text.secondary}`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <DialogButton variant="text" onClick={onCancel}>
          {t('cancel')}
        </DialogButton>
        <DialogButton onClick={handleConfirm}>{t('confirm')}</DialogButton>
      </div>
    </Dialog>
  )
}
