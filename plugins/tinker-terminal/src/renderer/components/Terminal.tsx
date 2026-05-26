import type { MenuItemConstructorOptions } from 'electron'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import SharedTerminal, { destroyTerminal } from 'share/components/Terminal'
import type { TerminalApi } from 'share/components/Terminal'
import store from '../store'

const api: TerminalApi = {
  write: (id, data) => terminal.write(id, data),
  resize: (id, cols, rows) => terminal.resize(id, cols, rows),
  onData: (id, cb) => terminal.onData(id, cb),
  onClose: (id, cb) => terminal.onClose(id, cb),
  onInput: (id, cb) => terminal.onInput(id, cb),
  getProcessName: (id) => terminal.getProcessName(id),
  getCwd: (id) => terminal.getCwd(id),
}

function destroyPane(paneId: string) {
  destroyTerminal(paneId, terminal)
}

interface TerminalProps {
  paneId: string
}

export default function Terminal({ paneId }: TerminalProps) {
  const { t } = useTranslation()

  const handleInit = useCallback((id: string, cols: number, rows: number) => {
    const sshConfig = store.pendingSSHConfig[id]
    if (sshConfig) {
      delete store.pendingSSHConfig[id]
      terminal.createSSH(id, cols, rows, {
        host: sshConfig.host!,
        port: sshConfig.port || 22,
        username: sshConfig.username!,
        authType: sshConfig.authType || 'password',
        password: sshConfig.password,
        privateKey: sshConfig.privateKey,
      })
      store.setPaneTitle(id, `${sshConfig.username}@${sshConfig.host}`)
    } else {
      const pendingCwd = store.pendingCwd[id]
      if (pendingCwd) {
        delete store.pendingCwd[id]
      }
      const pendingShell = store.pendingShell[id]
      if (pendingShell) {
        delete store.pendingShell[id]
      }
      terminal.create(id, cols, rows, pendingCwd, pendingShell)
    }
  }, [])

  const handleTitleChange = useCallback((id: string, title: string) => {
    store.setPaneTitle(id, title)
  }, [])

  const handleFocus = useCallback(() => {
    store.setActivePane(paneId)
  }, [paneId])

  const extraContextMenuItems = useCallback(
    (): MenuItemConstructorOptions[] => [
      {
        label: t('splitVertical'),
        click: () => store.splitPane(paneId, 'horizontal'),
      },
      {
        label: t('splitHorizontal'),
        click: () => store.splitPane(paneId, 'vertical'),
      },
      { type: 'separator' },
      {
        label: t('closePane'),
        click: () => store.closePane(paneId),
      },
    ],
    [paneId, t]
  )

  return (
    <SharedTerminal
      id={paneId}
      api={api}
      isDark={store.isDark}
      onInit={handleInit}
      onTitleChange={handleTitleChange}
      onFocus={handleFocus}
      extraContextMenuItems={extraContextMenuItems}
    />
  )
}

store.onDestroyPane = destroyPane
