import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Slider from 'share/components/Slider'
import { tw } from 'share/theme'

interface InsertSilenceDialogProps {
  open: boolean
  onConfirm: (duration: number) => void
  onCancel: () => void
}

const PRESETS = [1, 2, 3, 5, 10]

export default function InsertSilenceDialog({
  open,
  onConfirm,
  onCancel,
}: InsertSilenceDialogProps) {
  const { t } = useTranslation()
  const [seconds, setSeconds] = useState(1)

  const handleConfirm = () => {
    onConfirm(seconds)
  }

  return (
    <Dialog open={open} onClose={onCancel} title={t('insertSilence')}>
      <div className="mb-4">
        <div className={`text-sm mb-3 ${tw.text.primary}`}>
          {t('insertSilenceDuration')}: {seconds}s
        </div>
        <Slider min={1} max={60} value={seconds} onChange={setSeconds} />
        <div
          className={`flex justify-between text-xs mt-1 ${tw.text.tertiary}`}
        >
          <span>1s</span>
          <span>60s</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setSeconds(p)}
            className={`px-2 py-1 text-xs rounded ${tw.bg.tertiary} ${tw.hover} ${tw.text.secondary}`}
          >
            {p}s
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
