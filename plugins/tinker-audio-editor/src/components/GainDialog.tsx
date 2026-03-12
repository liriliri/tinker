import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Slider from 'share/components/Slider'
import { tw } from 'share/theme'

interface GainDialogProps {
  open: boolean
  onConfirm: (factor: number) => void
  onCancel: () => void
}

const PRESETS = [
  { labelKey: 'gainPresetSilence', val: 0 },
  { labelKey: 'gainPresetMinus50', val: 0.5 },
  { labelKey: 'gainPresetMinus25', val: 0.75 },
  { labelKey: 'gainPresetPlus25', val: 1.25 },
  { labelKey: 'gainPresetPlus50', val: 1.5 },
  { labelKey: 'gainPresetPlus100', val: 2.0 },
]

export default function GainDialog({
  open,
  onConfirm,
  onCancel,
}: GainDialogProps) {
  const { t } = useTranslation()
  const [percent, setPercent] = useState(100)

  const handleConfirm = () => {
    onConfirm(percent / 100)
  }

  const handlePreset = (val: number) => {
    setPercent(Math.round(val * 100))
  }

  return (
    <Dialog open={open} onClose={onCancel} title={t('gain')}>
      <div className="mb-4">
        <div className={`text-sm mb-3 ${tw.text.primary}`}>
          {t('gainLevel')}: {percent}%
        </div>
        <Slider min={0} max={250} value={percent} onChange={setPercent} />
        <div
          className={`flex justify-between text-xs mt-1 ${tw.text.tertiary}`}
        >
          <span>0%</span>
          <span>250%</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.labelKey}
            onClick={() => handlePreset(p.val)}
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
