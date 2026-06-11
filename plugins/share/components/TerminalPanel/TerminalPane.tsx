import type { MenuItemConstructorOptions } from 'electron'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import SharedTerminal, { destroyTerminal } from '../Terminal'
import { useTerminalPanel } from './context'
import { I18N_NS } from './i18n'

export { destroyTerminal as destroyPane }

interface TerminalPaneProps {
  paneId: string
}

export default function TerminalPane({ paneId }: TerminalPaneProps) {
  const { t } = useTranslation(I18N_NS)
  const { terminal, isDark } = useTerminalPanel()

  const createSession = useCallback(
    (cols: number, rows: number) => {
      const pendingCwd = terminal.pendingCwd[paneId]
      if (pendingCwd) {
        delete terminal.pendingCwd[paneId]
      }
      return tinker.createTerminal({
        cols,
        rows,
        cwd: pendingCwd || terminal.rootPath || undefined,
      })
    },
    [paneId, terminal]
  )

  const handleTitleChange = useCallback(
    (id: string, title: string) => {
      terminal.setPaneTitle(id, title)
    },
    [terminal]
  )

  const handleFocus = useCallback(() => {
    terminal.setActivePane(paneId)
  }, [paneId, terminal])

  const extraContextMenuItems = useCallback(
    (): MenuItemConstructorOptions[] => [
      {
        label: t('splitVertical'),
        click: () => terminal.splitPane(paneId, 'horizontal'),
      },
      {
        label: t('splitHorizontal'),
        click: () => terminal.splitPane(paneId, 'vertical'),
      },
      { type: 'separator' },
      {
        label: t('closePane'),
        click: () => terminal.closePane(paneId),
      },
    ],
    [paneId, t, terminal]
  )

  return (
    <SharedTerminal
      id={paneId}
      createSession={createSession}
      isDark={isDark}
      onTitleChange={handleTitleChange}
      onFocus={handleFocus}
      extraContextMenuItems={extraContextMenuItems}
    />
  )
}
