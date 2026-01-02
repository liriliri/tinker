import { useState, useEffect } from 'react'
import Dialog from 'share/components/Dialog'
import Checkbox from 'share/components/Checkbox'
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
  const [width, setWidth] = useState(String(Math.round(currentWidth)))
  const [height, setHeight] = useState(String(Math.round(currentHeight)))
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [aspectRatio, setAspectRatio] = useState(1)

  useEffect(() => {
    if (open) {
      const w = Math.round(currentWidth)
      const h = Math.round(currentHeight)
      setWidth(String(w))
      setHeight(String(h))
      setAspectRatio(h > 0 ? w / h : 1)
      setKeepAspectRatio(true)
    }
  }, [open, currentWidth, currentHeight])

  const handleWidthChange = (value: string) => {
    setWidth(value)

    if (keepAspectRatio && !isNaN(parseInt(value, 10))) {
      const w = parseInt(value, 10)
      const h = Math.round(w / aspectRatio)
      setHeight(String(h))
    }
  }

  const handleHeightChange = (value: string) => {
    setHeight(value)

    if (keepAspectRatio && !isNaN(parseInt(value, 10))) {
      const h = parseInt(value, 10)
      const w = Math.round(h * aspectRatio)
      setWidth(String(w))
    }
  }

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
    <Dialog open={open} onClose={onClose} title={t('resizeImage')}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
            {t('width')}
          </label>
          <input
            type="number"
            className={`flex-1 px-3 py-2 border ${tw.border.both} rounded ${tw.bg.light.primary} ${tw.bg.dark.tertiary} text-gray-800 dark:text-gray-200 focus:outline-none`}
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
            {t('height')}
          </label>
          <input
            type="number"
            className={`flex-1 px-3 py-2 border ${tw.border.both} rounded ${tw.bg.light.primary} ${tw.bg.dark.tertiary} text-gray-800 dark:text-gray-200 focus:outline-none`}
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
        <button
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          onClick={onClose}
        >
          {t('cancel')}
        </button>
        <button
          className={`px-4 py-2 text-sm ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleConfirm}
          disabled={!isValid}
        >
          {t('confirm')}
        </button>
      </div>
    </Dialog>
  )
}
