import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import FileInput from 'share/components/FileInput'
import Select from 'share/components/Select'
import type { SelectOption } from 'share/components/Select'
import type { ISessionConfig, SessionType, SSHAuthType } from '../lib/db'

interface SessionConfigDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (config: Omit<ISessionConfig, 'id'>) => void
  initialConfig?: ISessionConfig | null
  sessionType: SessionType
}

export default function SessionConfigDialog({
  open,
  onClose,
  onConfirm,
  initialConfig,
  sessionType,
}: SessionConfigDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [shell, setShell] = useState('')
  const [cwd, setCwd] = useState('')
  // SSH fields
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [authType, setAuthType] = useState<SSHAuthType>('none')
  const [password, setPassword] = useState('')
  const [privateKey, setPrivateKey] = useState('')

  const isEditing = !!initialConfig
  const isSSH = sessionType === 'ssh'

  const shellOptions: SelectOption[] = useMemo(() => {
    if (!open || isSSH) return []
    const shells = terminal.getAvailableShells()
    return [
      { label: t('defaultShell'), value: '' },
      ...shells.map((s) => ({ label: s.name, value: s.path })),
    ]
  }, [open, t, isSSH])

  const authTypeOptions: SelectOption[] = useMemo(
    () => [
      { label: t('authNone'), value: 'none' },
      { label: t('authPassword'), value: 'password' },
      { label: t('authPrivateKey'), value: 'privateKey' },
    ],
    [t]
  )

  useEffect(() => {
    if (open) {
      setName(initialConfig?.name || '')
      setShell(initialConfig?.shell || '')
      setCwd(initialConfig?.cwd || '')
      setHost(initialConfig?.host || '')
      setPort(String(initialConfig?.port || 22))
      setUsername(initialConfig?.username || '')
      setAuthType(initialConfig?.authType || 'none')
      setPassword(initialConfig?.password || '')
      setPrivateKey(initialConfig?.privateKey || '')
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

  const handleBrowseKey = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths[0]) {
      setPrivateKey(result.filePaths[0])
    }
  }

  const handleConfirm = () => {
    if (!name.trim()) return

    if (isSSH) {
      if (!host.trim() || !username.trim()) return
      onConfirm({
        name: name.trim(),
        type: 'ssh',
        host: host.trim(),
        port: parseInt(port, 10) || 22,
        username: username.trim(),
        authType,
        password: authType === 'password' ? password : undefined,
        privateKey: authType === 'privateKey' ? privateKey : undefined,
      })
    } else {
      onConfirm({
        name: name.trim(),
        type: 'local',
        shell: shell || undefined,
        cwd: cwd || undefined,
      })
    }
    onClose()
  }

  const title = isEditing
    ? t('editSession')
    : isSSH
    ? t('sshSession')
    : t('localSession')

  const isConfirmDisabled = isSSH
    ? !name.trim() || !host.trim() || !username.trim()
    : !name.trim()

  return (
    <Dialog open={open} onClose={onClose} title={title}>
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

        {isSSH ? (
          <>
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
                  onChange={(v) => setAuthType(v as SSHAuthType)}
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
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={`text-sm font-medium ${tw.text.secondary}`}>
                {t('shellType')}
              </label>
              <Select
                value={shell}
                onChange={(v) => setShell(v)}
                options={shellOptions}
                className="w-full [&>select]:text-sm [&>select]:px-2.5 [&>select]:py-1.5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-sm font-medium ${tw.text.secondary}`}>
                {t('workingDirectory')}
              </label>
              <FileInput
                value={cwd}
                onChange={(e) => setCwd(e.target.value)}
                placeholder="~"
                onBrowse={handleBrowse}
              />
            </div>
          </>
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
