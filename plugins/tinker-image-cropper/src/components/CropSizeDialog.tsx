import { useState, useEffect } from 'react'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
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
  const [width, setWidth] = useState(String(Math.round(currentWidth)))
  const [height, setHeight] = useState(String(Math.round(currentHeight)))

  useEffect(() => {
    if (open) {
      setWidth(String(Math.round(currentWidth)))
      setHeight(String(Math.round(currentHeight)))
    }
  }, [open, currentWidth, currentHeight])

  const handleConfirm = () => {
    const w = parseInt(width, 10)
    const h = parseInt(height, 10)

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return
    }

    // Clamp to max dimensions
    const finalWidth = Math.min(w, maxWidth)
    const finalHeight = Math.min(h, maxHeight)

    onConfirm(finalWidth, finalHeight)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  const isValid =
    width.trim() !== '' &&
    height.trim() !== '' &&
    !isNaN(parseInt(width, 10)) &&
    !isNaN(parseInt(height, 10)) &&
    parseInt(width, 10) > 0 &&
    parseInt(height, 10) > 0

  return (
    <Dialog open={open} onClose={onClose} title={t('setCropSize')}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label
            className={`text-sm font-medium ${tw.text.both.secondary} w-12`}
          >
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
          <label
            className={`text-sm font-medium ${tw.text.both.secondary} w-12`}
          >
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
