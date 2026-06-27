import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import FileInput from 'share/components/FileInput'
import Select from 'share/components/Select'
import type { SelectOption } from 'share/components/Select'
import type { ISftpSessionConfig, SftpAuthType } from '../../common/types'

interface SessionConfigDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (config: Omit<ISftpSessionConfig, 'id'>) => void
  initialConfig?: ISftpSessionConfig | null
}

export default function SessionConfigDialog({
  open,
  onClose,
  onConfirm,
  initialConfig,
}: SessionConfigDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [authType, setAuthType] = useState<SftpAuthType>('password')
  const [password, setPassword] = useState('')
  const [privateKey, setPrivateKey] = useState('')

  const isEditing = !!initialConfig

  const authTypeOptions: SelectOption[] = useMemo(
    () => [
      { label: t('authPassword'), value: 'password' },
      { label: t('authPrivateKey'), value: 'privateKey' },
    ],
    [t]
  )

  useEffect(() => {
    if (!open) return
    setName(initialConfig?.name || '')
    setHost(initialConfig?.host || '')
    setPort(String(initialConfig?.port || 22))
    setUsername(initialConfig?.username || '')
    setAuthType(initialConfig?.authType || 'password')
    setPassword(initialConfig?.password || '')
    setPrivateKey(initialConfig?.privateKey || '')
  }, [open, initialConfig])

  const handleBrowseKey = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths[0]) {
      setPrivateKey(result.filePaths[0])
    }
  }

  const handleConfirm = () => {
    if (!name.trim() || !host.trim() || !username.trim()) return

    onConfirm({
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port, 10) || 22,
      username: username.trim(),
      authType,
      password: authType === 'password' ? password : undefined,
      privateKey: authType === 'privateKey' ? privateKey : undefined,
    })
    onClose()
  }

  const isConfirmDisabled =
    !name.trim() ||
    !host.trim() ||
    !username.trim() ||
    (authType === 'password' ? !password : !privateKey.trim())

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

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 w-1/2">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('host')}
            </label>
            <TextInput
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="192.168.1.1"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-1/2">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('port')}
            </label>
            <TextInput
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="22"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 w-1/2">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('username')}
            </label>
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="root"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-1/2">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('authType')}
            </label>
            <Select
              value={authType}
              onChange={(v) => setAuthType(v as SftpAuthType)}
              options={authTypeOptions}
              className="w-full [&>select]:text-sm [&>select]:px-2.5 [&>select]:py-1.5"
            />
          </div>
        </div>

        {authType === 'password' && (
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('password')}
            </label>
            <TextInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>
        )}

        {authType === 'privateKey' && (
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('privateKey')}
            </label>
            <FileInput
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="~/.ssh/id_rsa"
              onBrowse={handleBrowseKey}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <DialogButton variant="text" onClick={onClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleConfirm} disabled={isConfirmDisabled}>
            {isEditing ? t('save') : t('create')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
}
