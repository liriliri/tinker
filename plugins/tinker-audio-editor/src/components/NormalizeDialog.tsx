import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Slider from 'share/components/Slider'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'

interface NormalizeDialogProps {
  open: boolean
  onConfirm: (maxVal: number, equally: boolean) => void
  onCancel: () => void
}

export default function NormalizeDialog({
  open,
  onConfirm,
  onCancel,
}: NormalizeDialogProps) {
  const { t } = useTranslation()
  const [percent, setPercent] = useState(100)
  const [equally, setEqually] = useState(true)

  const handleConfirm = () => {
    onConfirm(percent / 100, equally)
  }

  return (
    <Dialog open={open} onClose={onCancel} title={t('normalize')}>
      <div className="mb-4">
        <div className={`text-sm mb-3 ${tw.text.primary}`}>
          {t('normalizeLevel')}: {percent}%
        </div>
        <Slider min={0} max={200} value={percent} onChange={setPercent} />
        <div
          className={`flex justify-between text-xs mt-1 ${tw.text.tertiary}`}
        >
          <span>0%</span>
          <span>200%</span>
        </div>
      </div>
      <div className="mb-6">
        <Checkbox checked={equally} onChange={setEqually}>
          {t('normalizeEqually')}
        </Checkbox>
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
