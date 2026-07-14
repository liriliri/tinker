import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store from '../store'

interface SizeDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (width: number, height: number) => void
  currentWidth: number
  currentHeight: number
}

export default function SizeDialog({
  open,
  onClose,
  onConfirm,
  currentWidth,
  currentHeight,
}: SizeDialogProps) {
  const { t } = useTranslation()
  const [width, setWidth] = useState(String(currentWidth))
  const [height, setHeight] = useState(String(currentHeight))

  useEffect(() => {
    if (open) {
      setWidth(String(currentWidth))
      setHeight(String(currentHeight))
    }
  }, [open, currentWidth, currentHeight])

  const parsedWidth = parseInt(width, 10)
  const parsedHeight = parseInt(height, 10)

  const isValid = parsedWidth > 0 && parsedHeight > 0

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(parsedWidth, parsedHeight)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('floatSettings')} showClose>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.secondary} w-12`}>
            {t('width')}
          </label>
          <TextInput
            type="number"
            className="flex-1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyDown={handleKeyDown}
            min={String(store.minWindowWidth)}
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.secondary} w-12`}>
            {t('height')}
          </label>
          <TextInput
            type="number"
            className="flex-1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            min={String(store.minWindowHeight)}
          />
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
