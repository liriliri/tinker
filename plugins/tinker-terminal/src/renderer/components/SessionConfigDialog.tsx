import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import { tw } from 'share/theme'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import Select from 'share/components/Select'
import type { SelectOption } from 'share/components/Select'
import type { ISessionConfig } from '../lib/db'

interface SessionConfigDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (config: Omit<ISessionConfig, 'id'>) => void
  initialConfig?: ISessionConfig | null
}

export default function SessionConfigDialog({
  open,
  onClose,
  onConfirm,
  initialConfig,
}: SessionConfigDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [shell, setShell] = useState('')
  const [cwd, setCwd] = useState('')
  const isEditing = !!initialConfig

  const shellOptions: SelectOption[] = useMemo(() => {
    if (!open) return []
    const shells = terminal.getAvailableShells()
    return [
      { label: t('defaultShell'), value: '' },
      ...shells.map((s) => ({ label: s.name, value: s.path })),
    ]
  }, [open, t])

  useEffect(() => {
    if (open) {
      setName(initialConfig?.name || '')
      setShell(initialConfig?.shell || '')
      setCwd(initialConfig?.cwd || '')
    }
  }, [open, initialConfig])

  const handleBrowse = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!result.canceled && result.filePaths[0]) {
      setCwd(result.filePaths[0])
    }
  }

  const handleConfirm = () => {
    if (!name.trim()) return
    onConfirm({
      name: name.trim(),
      type: 'local',
      shell: shell || undefined,
      cwd: cwd || undefined,
    })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? t('editSession') : t('newSession')}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('sessionName')}
          </label>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('shellType')}
          </label>
          <Select
            value={shell}
            onChange={(v) => setShell(v)}
            options={shellOptions}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('workingDirectory')}
          </label>
          <div className="flex gap-2">
            <TextInput
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="~"
            />
            <button
              onClick={handleBrowse}
              className={`flex-shrink-0 px-3 py-2 rounded border ${tw.border} ${tw.hover} ${tw.text.secondary}`}
            >
              <FolderOpen size={16} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <DialogButton variant="text" onClick={onClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleConfirm} disabled={!name.trim()}>
            {isEditing ? t('save') : t('create')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
}
