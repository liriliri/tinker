import { useState, useEffect } from 'react'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import isStrBlank from 'licia/isStrBlank'
import toInt from 'licia/toInt'
import toStr from 'licia/toStr'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'

interface CanvasSizeDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (width: number, height: number) => void
  currentWidth: number
  currentHeight: number
}

export default function CanvasSizeDialog({
  open,
  onClose,
  onConfirm,
  currentWidth,
  currentHeight,
}: CanvasSizeDialogProps) {
  const { t } = useTranslation()
  const [width, setWidth] = useState(toStr(currentWidth))
  const [height, setHeight] = useState(toStr(currentHeight))

  useEffect(() => {
    if (open) {
      setWidth(toStr(currentWidth))
      setHeight(toStr(currentHeight))
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
    <Dialog open={open} onClose={onClose} title={t('setCanvasSize')} showClose>
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
