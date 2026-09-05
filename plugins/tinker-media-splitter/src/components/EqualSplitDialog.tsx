import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import toNum from 'licia/toNum'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import { formatTimecode } from '../lib/util'
import { estimateSegmentBytes } from '../lib/segments'

const MIN_COUNT = 2
const MAX_COUNT = 100
const DEFAULT_COUNT = 2

interface EqualSplitDialogProps {
  open: boolean
  duration: number
  fileSizeBytes: number
  onClose: () => void
  onConfirm: (count: number) => void
}

export default function EqualSplitDialog({
  open,
  duration,
  fileSizeBytes,
  onClose,
  onConfirm,
}: EqualSplitDialogProps) {
  const { t } = useTranslation()
  const [countText, setCountText] = useState(String(DEFAULT_COUNT))

  useEffect(() => {
    if (open) setCountText(String(DEFAULT_COUNT))
  }, [open])

  const count = Math.floor(toNum(countText))
  const isValid = count >= MIN_COUNT && count <= MAX_COUNT
  const segmentDuration = isValid && duration > 0 ? duration / count : 0
  const segmentBytes = estimateSegmentBytes(
    segmentDuration,
    duration,
    fileSizeBytes
  )

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(count)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('equalSplit')} showClose>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label
            className={`text-sm font-medium shrink-0 ${tw.text.secondary}`}
          >
            {t('equalSplitCount')}
          </label>
          <TextInput
            type="number"
            className="flex-1"
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleConfirm()
              }
            }}
            min={MIN_COUNT}
            max={MAX_COUNT}
            autoFocus
          />
        </div>
        {isValid ? (
          <div
            className={`flex items-center justify-between gap-3 text-xs ${tw.text.tertiary}`}
          >
            <span>{t('equalSplitCountHint', { count })}</span>
            <span className="tabular-nums text-right">
              {t('equalSplitEachHint', {
                duration: formatTimecode(segmentDuration),
                size: fileSize(segmentBytes),
              })}
            </span>
          </div>
        ) : (
          <p className={`text-xs ${tw.text.tertiary}`}>
            {t('equalSplitInvalid', { min: MIN_COUNT, max: MAX_COUNT })}
          </p>
        )}
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <DialogButton onClick={handleConfirm} disabled={!isValid}>
          {t('confirm')}
        </DialogButton>
      </div>
    </Dialog>
  )
}
