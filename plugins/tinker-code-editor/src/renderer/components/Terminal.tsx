import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import SharedTerminal, { destroyTerminal } from 'share/components/Terminal'
import type { TerminalApi } from 'share/components/Terminal'
import store from '../store'

const api: TerminalApi = {
  write: (id, data) => codeEditor.writeTerminal(id, data),
  resize: (id, cols, rows) => codeEditor.resizeTerminal(id, cols, rows),
  onData: (id, cb) => codeEditor.onTerminalData(id, cb),
  onClose: (id, cb) => codeEditor.onTerminalClose(id, cb),
  onInput: (id, cb) => codeEditor.onTerminalInput(id, cb),
  getProcessName: (id) => codeEditor.getTerminalProcessName(id),
  getCwd: (id) => codeEditor.getTerminalCwd(id),
}

export function destroyPane(paneId: string) {
  destroyTerminal(paneId, { destroy: codeEditor.destroyTerminal })
}

interface TerminalProps {
  paneId: string
}

export default function Terminal({ paneId }: TerminalProps) {
  const { t } = useTranslation()

  const handleInit = useCallback((id: string, cols: number, rows: number) => {
    const pendingCwd = store.pendingCwd[id]
    if (pendingCwd) {
      delete store.pendingCwd[id]
    }
    codeEditor.createTerminal(
      id,
      cols,
      rows,
      pendingCwd || store.rootPath || undefined
    )
  }, [])

  const handleTitleChange = useCallback((id: string, title: string) => {
    store.setPaneTitle(id, title)
  }, [])

  const handleFocus = useCallback(() => {
    store.setActivePane(paneId)
  }, [paneId])

  const extraContextMenuItems = useCallback(
    (): tinker.MenuItem[] => [
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
