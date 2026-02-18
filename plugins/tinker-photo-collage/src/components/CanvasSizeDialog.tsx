import { useState, useEffect } from 'react'
import Dialog, { DialogButton } from 'share/components/Dialog'
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
  const [width, setWidth] = useState(String(currentWidth))
  const [height, setHeight] = useState(String(currentHeight))

  useEffect(() => {
    if (open) {
      setWidth(String(currentWidth))
      setHeight(String(currentHeight))
    }
  }, [open, currentWidth, currentHeight])

  const handleConfirm = () => {
    const w = parseInt(width, 10)
    const h = parseInt(height, 10)

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return
    }

    onConfirm(w, h)
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
    <Dialog open={open} onClose={onClose} title={t('setCanvasSize')}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.both.primary} w-12`}>
            {t('width')}
          </label>
          <input
            type="number"
            className={`flex-1 px-3 py-2 border ${tw.border} rounded ${tw.bg.tertiary} ${tw.text.both.primary} focus:outline-none`}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${tw.text.both.primary} w-12`}>
            {t('height')}
          </label>
          <input
            type="number"
            className={`flex-1 px-3 py-2 border ${tw.border} rounded ${tw.bg.tertiary} ${tw.text.both.primary} focus:outline-none`}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
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
