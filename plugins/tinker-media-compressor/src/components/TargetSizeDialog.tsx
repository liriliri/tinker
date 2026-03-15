import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import TextInput from 'share/components/TextInput'
import store from '../store'
import type { TargetSizeUnit } from '../types'

const UNIT_OPTIONS: Array<{ label: TargetSizeUnit; value: TargetSizeUnit }> = [
  { label: 'KB', value: 'KB' },
  { label: 'MB', value: 'MB' },
  { label: 'GB', value: 'GB' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function TargetSizeDialog({ open, onClose }: Props) {
  const { t } = useTranslation()
  const [size, setSize] = useState(String(store.targetSize))
  const [unit, setUnit] = useState<TargetSizeUnit>(store.targetSizeUnit)

  useEffect(() => {
    if (open) {
      setSize(String(store.targetSize))
      setUnit(store.targetSizeUnit)
    }
  }, [open])

  const handleConfirm = () => {
    const n = parseFloat(size)
    if (!isNaN(n) && n > 0) {
      store.setTargetSize(n, unit)
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('targetSize')}>
      <div className="space-y-3">
        <div className="flex gap-3">
          <TextInput
            type="number"
            className="flex-1"
            min={0.1}
            step={0.1}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            autoFocus
          />
          <Select<TargetSizeUnit>
            value={unit}
            onChange={setUnit}
            options={UNIT_OPTIONS}
            className="w-24 h-10"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <DialogButton variant="text" onClick={onClose}>
          {t('cancel')}
        </DialogButton>
        <DialogButton onClick={handleConfirm}>{t('confirm')}</DialogButton>
      </div>
    </Dialog>
  )
}
