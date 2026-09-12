import { useState, useEffect } from 'react'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Checkbox from 'share/components/Checkbox'
import TextInput from 'share/components/TextInput'
import isStrBlank from 'licia/isStrBlank'
import toInt from 'licia/toInt'
import toStr from 'licia/toStr'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'

interface ResizeImageDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (width: number, height: number) => void
  currentWidth: number
  currentHeight: number
}

export default function ResizeImageDialog({
  open,
  onClose,
  onConfirm,
  currentWidth,
  currentHeight,
}: ResizeImageDialogProps) {
  const { t } = useTranslation()
  const [width, setWidth] = useState(toStr(Math.round(currentWidth)))
  const [height, setHeight] = useState(toStr(Math.round(currentHeight)))
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [aspectRatio, setAspectRatio] = useState(1)

  useEffect(() => {
    if (open) {
      const w = Math.round(currentWidth)
      const h = Math.round(currentHeight)
      setWidth(toStr(w))
      setHeight(toStr(h))
      setAspectRatio(h > 0 ? w / h : 1)
      setKeepAspectRatio(true)
    }
  }, [open, currentWidth, currentHeight])

  const parsedWidth = toInt(width)
  const parsedHeight = toInt(height)
  const isValid =
    !isStrBlank(width) &&
    !isStrBlank(height) &&
    parsedWidth > 0 &&
    parsedHeight > 0

  const handleWidthChange = (value: string) => {
    setWidth(value)

    const w = toInt(value)
    if (keepAspectRatio && !isStrBlank(value) && w > 0) {
      setHeight(toStr(Math.round(w / aspectRatio)))
    }
  }

  const handleHeightChange = (value: string) => {
    setHeight(value)

    const h = toInt(value)
    if (keepAspectRatio && !isStrBlank(value) && h > 0) {
      setWidth(toStr(Math.round(h * aspectRatio)))
    }
  }

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
    <Dialog open={open} onClose={onClose} title={t('resizeImage')} showClose>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.secondary} w-12`}>
            {t('width')}
          </label>
          <TextInput
            type="number"
            className="flex-1"
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
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
            onChange={(e) => handleHeightChange(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
          />
        </div>

        <div className="pt-2">
          <Checkbox checked={keepAspectRatio} onChange={setKeepAspectRatio}>
            {t('keepAspectRatio')}
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
