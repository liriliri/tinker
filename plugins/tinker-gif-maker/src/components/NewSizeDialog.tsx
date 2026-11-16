import { useEffect, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import toInt from 'licia/toInt'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import { DEFAULT_BLANK_HEIGHT, DEFAULT_BLANK_WIDTH } from '../lib/gif'

const MIN_SIZE = 1
const MAX_SIZE = 4000

interface NewSizeDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (width: number, height: number) => void
  defaultWidth?: number
  defaultHeight?: number
}

export default function NewSizeDialog({
  open,
  onClose,
  onConfirm,
  defaultWidth = DEFAULT_BLANK_WIDTH,
  defaultHeight = DEFAULT_BLANK_HEIGHT,
}: NewSizeDialogProps) {
  const { t } = useTranslation()
  const [width, setWidth] = useState(String(defaultWidth))
  const [height, setHeight] = useState(String(defaultHeight))

  useEffect(() => {
    if (open) {
      setWidth(String(defaultWidth))
      setHeight(String(defaultHeight))
    }
  }, [open, defaultWidth, defaultHeight])

  const w = toInt(width)
  const h = toInt(height)
  const isValid =
    !isStrBlank(width) &&
    !isStrBlank(height) &&
    w >= MIN_SIZE &&
    h >= MIN_SIZE &&
    w <= MAX_SIZE &&
    h <= MAX_SIZE

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(w, h)
    onClose()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('newGif')} showClose>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.secondary} w-14`}>
            {t('width')}
          </label>
          <TextInput
            type="number"
            className="flex-1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyDown={handleKeyDown}
            min={MIN_SIZE}
            max={MAX_SIZE}
            autoFocus
          />
        </div>
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.secondary} w-14`}>
            {t('height')}
          </label>
          <TextInput
            type="number"
            className="flex-1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            min={MIN_SIZE}
            max={MAX_SIZE}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <DialogButton variant="text" onClick={onClose}>
          {t('cancel')}
        </DialogButton>
        <DialogButton onClick={handleConfirm} disabled={!isValid}>
          {t('confirm')}
        </DialogButton>
      </div>
    </Dialog>
  )
}
