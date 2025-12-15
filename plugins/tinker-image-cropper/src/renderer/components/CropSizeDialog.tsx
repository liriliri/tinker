import { useState, useEffect } from 'react'
import Dialog from 'share/components/Dialog'
import { useTranslation } from 'react-i18next'

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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
            {t('width')}
          </label>
          <input
            type="number"
            className="flex-1 px-3 py-2 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#252526] text-gray-800 dark:text-gray-200 focus:outline-none"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            max={maxWidth}
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
            {t('height')}
          </label>
          <input
            type="number"
            className="flex-1 px-3 py-2 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#252526] text-gray-800 dark:text-gray-200 focus:outline-none"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            max={maxHeight}
          />
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
          className="px-4 py-2 text-sm bg-[#0fc25e] hover:bg-[#0db350] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleConfirm}
          disabled={!isValid}
        >
          {t('confirm')}
        </button>
      </div>
    </Dialog>
  )
}
