import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import FileInput from 'share/components/FileInput'

interface CustomPlaceDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (label: string, path: string) => void
  initialLabel?: string
  initialPath?: string
}

export default function CustomPlaceDialog({
  open,
  onClose,
  onConfirm,
  initialLabel,
  initialPath,
}: CustomPlaceDialogProps) {
  const { t } = useTranslation()
  const [label, setLabel] = useState('')
  const [path, setPath] = useState('')

  const isEditing = !!initialLabel

  useEffect(() => {
    if (open) {
      setLabel(initialLabel || '')
      setPath(initialPath || '')
    }
  }, [open, initialLabel, initialPath])

  const handleBrowse = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!result.canceled && result.filePaths[0]) {
      setPath(result.filePaths[0])
    }
  }

  const handleConfirm = () => {
    const trimmedLabel = label.trim()
    const trimmedPath = path.trim()
    if (!trimmedLabel || !trimmedPath) return
    onConfirm(trimmedLabel, trimmedPath)
    onClose()
  }

  const isConfirmDisabled = !label.trim() || !path.trim()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? t('editPlace') : t('addCustomPlace')}
      showClose
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('placeName')}
          </label>
          <TextInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('placePath')}
          </label>
          <FileInput
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onBrowse={handleBrowse}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
            }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <DialogButton onClick={handleConfirm} disabled={isConfirmDisabled}>
            {isEditing ? t('save') : t('create')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
}
