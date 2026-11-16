import { useEffect, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import toInt from 'licia/toInt'
import Checkbox from 'share/components/Checkbox'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import { DEFAULT_DELAY_MS, MAX_DELAY_MS, MIN_DELAY_MS } from '../lib/gif'

interface DelayDialogProps {
  open: boolean
  delay: number
  onClose: () => void
  onConfirm: (delay: number, applyToAll: boolean) => void
}

export default function DelayDialog({
  open,
  delay,
  onClose,
  onConfirm,
}: DelayDialogProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(String(delay || DEFAULT_DELAY_MS))
  const [applyToAll, setApplyToAll] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(String(delay || DEFAULT_DELAY_MS))
      setApplyToAll(false)
    }
  }, [open, delay])

  const nextDelay = toInt(value)
  const isValid =
    !isStrBlank(value) && nextDelay >= MIN_DELAY_MS && nextDelay <= MAX_DELAY_MS

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(nextDelay, applyToAll)
    onClose()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('setDelay')} showClose>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.secondary} w-14`}>
            {t('delay')}
          </label>
          <div className="flex flex-1 items-center gap-2">
            <TextInput
              type="number"
              className="flex-1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              min={MIN_DELAY_MS}
              max={MAX_DELAY_MS}
              autoFocus
            />
            <span className={`text-sm shrink-0 ${tw.text.secondary}`}>ms</span>
          </div>
        </div>
        <div className="pt-2">
          <Checkbox checked={applyToAll} onChange={setApplyToAll}>
            {t('applyToAllFrames')}
          </Checkbox>
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <DialogButton onClick={handleConfirm} disabled={!isValid}>
          {t('confirm')}
        </DialogButton>
      </div>
    </Dialog>
  )
}
