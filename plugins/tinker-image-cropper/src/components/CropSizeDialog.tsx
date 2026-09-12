import { useState, useEffect } from 'react'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import clamp from 'licia/clamp'
import isStrBlank from 'licia/isStrBlank'
import toInt from 'licia/toInt'
import toStr from 'licia/toStr'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'

interface CropSizeDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (width: number, height: number) => void
  currentWidth: number
  currentHeight: number
  maxWidth: number
  maxHeight: number
}

export default function CropSizeDialog({
  open,
  onClose,
  onConfirm,
  currentWidth,
  currentHeight,
  maxWidth,
  maxHeight,
}: CropSizeDialogProps) {
  const { t } = useTranslation()
  const [width, setWidth] = useState(toStr(Math.round(currentWidth)))
  const [height, setHeight] = useState(toStr(Math.round(currentHeight)))

  useEffect(() => {
    if (open) {
      setWidth(toStr(Math.round(currentWidth)))
      setHeight(toStr(Math.round(currentHeight)))
    }
  }, [open, currentWidth, currentHeight])

  const parsedWidth = toInt(width)
  const parsedHeight = toInt(height)
  const isValid =
    !isStrBlank(width) &&
    !isStrBlank(height) &&
    parsedWidth > 0 &&
    parsedHeight > 0

  const handleConfirm = () => {
    if (!isValid) return

    onConfirm(clamp(parsedWidth, maxWidth), clamp(parsedHeight, maxHeight))
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('setCropSize')} showClose>
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
            min="1"
            max={maxWidth}
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
            min="1"
            max={maxHeight}
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
