import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { PanelLeft, PanelLeftClose, FolderOpen, Terminal } from 'lucide-react'
import {
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
} from 'share/components/StatusBar'
import store from '../store'

export default observer(function StatusBarComponent() {
  const { t } = useTranslation()
  return (
    <StatusBar>
      <StatusBarItem onClick={() => store.toggleSidebar()}>
        {store.sidebarOpen ? (
          <PanelLeftClose size={14} />
        ) : (
          <PanelLeft size={14} />
        )}
      </StatusBarItem>
      <StatusBarItem onClick={() => store.openFolder()}>
        <FolderOpen size={14} />
      </StatusBarItem>
      <StatusBarSpacer />
      {store.activeTabId && (
        <StatusBarItem clickable={false}>
          {t('cursor', { line: store.cursorLine, col: store.cursorColumn })}
        </StatusBarItem>
      )}
      <StatusBarItem onClick={() => store.toggleTerminal()}>
        <Terminal size={14} />
      </StatusBarItem>
    </StatusBar>
  )
})
