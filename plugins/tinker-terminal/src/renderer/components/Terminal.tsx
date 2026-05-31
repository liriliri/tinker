import type { MenuItemConstructorOptions } from 'electron'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import SharedTerminal, { destroyTerminal } from 'share/components/Terminal'
import store from '../store'

function destroyPane(paneId: string) {
  destroyTerminal(paneId)
}

interface TerminalProps {
  paneId: string
}

export default function Terminal({ paneId }: TerminalProps) {
  const { t } = useTranslation()

  const createSession = useCallback(
    (cols: number, rows: number) => {
      const sshConfig = store.pendingSSHConfig[paneId]
      if (sshConfig) {
        delete store.pendingSSHConfig[paneId]
        store.setPaneTitle(paneId, `${sshConfig.username}@${sshConfig.host}`)
        return terminal.createSSH(cols, rows, {
          host: sshConfig.host!,
          port: sshConfig.port || 22,
          username: sshConfig.username!,
          authType: sshConfig.authType || 'password',
          password: sshConfig.password,
          privateKey: sshConfig.privateKey,
        })
      }

      const pendingCwd = store.pendingCwd[paneId]
      if (pendingCwd) {
        delete store.pendingCwd[paneId]
      }
      const pendingShell = store.pendingShell[paneId]
      if (pendingShell) {
        delete store.pendingShell[paneId]
      }
      return tinker.createTerminal({
        cols,
        rows,
        cwd: pendingCwd,
        shell: pendingShell,
      })
    },
    [paneId]
  )

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
      createSession={createSession}
      isDark={store.isDark}
      onTitleChange={handleTitleChange}
      onFocus={handleFocus}
      extraContextMenuItems={extraContextMenuItems}
    />
  )
}

store.onDestroyPane = destroyPane
