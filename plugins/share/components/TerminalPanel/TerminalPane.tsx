import type { MenuItemConstructorOptions } from 'electron'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import SharedTerminal from '../Terminal'
import type { TerminalPaneLayoutProps } from '../../lib/terminalPanel'
import { I18N_NS } from './i18n'

interface TerminalPaneProps extends TerminalPaneLayoutProps {
  paneId: string
}

export default function TerminalPane({
  paneId,
  isDark,
  createSession,
  onSetPaneTitle,
  onSetActivePane,
  onSplitPane,
  onClosePane,
}: TerminalPaneProps) {
  const { t } = useTranslation(I18N_NS)

  const handleCreateSession = useCallback(
    (cols: number, rows: number) => createSession(paneId, cols, rows),
    [createSession, paneId]
  )

  const extraContextMenuItems = useCallback(
    (): MenuItemConstructorOptions[] => [
      {
        label: t('splitVertical'),
        click: () => onSplitPane(paneId, 'horizontal'),
      },
      {
        label: t('splitHorizontal'),
        click: () => onSplitPane(paneId, 'vertical'),
      },
      { type: 'separator' },
      {
        label: t('closePane'),
        click: () => onClosePane(paneId),
      },
    ],
    [onClosePane, onSplitPane, paneId, t]
  )

  return (
    <SharedTerminal
      id={paneId}
      createSession={handleCreateSession}
      isDark={isDark}
      onTitleChange={onSetPaneTitle}
      onFocus={() => onSetActivePane(paneId)}
      extraContextMenuItems={extraContextMenuItems}
    />
  )
}
