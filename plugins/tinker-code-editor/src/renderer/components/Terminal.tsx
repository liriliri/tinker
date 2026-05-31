import type { MenuItemConstructorOptions } from 'electron'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import SharedTerminal, { destroyTerminal } from 'share/components/Terminal'
import store from '../store'

export { destroyTerminal as destroyPane }

interface TerminalProps {
  paneId: string
}

export default function Terminal({ paneId }: TerminalProps) {
  const { t } = useTranslation()

  const createSession = useCallback(
    (cols: number, rows: number) => {
      const pendingCwd = store.pendingCwd[paneId]
      if (pendingCwd) {
        delete store.pendingCwd[paneId]
      }
      return tinker.createTerminal({
        cols,
        rows,
        cwd: pendingCwd || store.rootPath || undefined,
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
