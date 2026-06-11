import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import {
  PanelLeft,
  PanelLeftClose,
  FolderOpen,
  Search,
  FileText,
  GitBranch,
  X,
  Terminal,
} from 'lucide-react'
import {
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
} from 'share/components/StatusBar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function StatusBarComponent() {
  const { t } = useTranslation()

  const explorerActive = store.sidebarOpen && store.sidebarMode === 'explorer'
  const searchActive = store.sidebarOpen && store.sidebarMode === 'search'
  const gitActive = store.sidebarOpen && store.sidebarMode === 'git'

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
      <StatusBarItem onClick={() => store.closeProject()}>
        <X size={14} />
      </StatusBarItem>
      <StatusBarItem
        onClick={() => store.setSidebarMode('explorer')}
        className={className(explorerActive && tw.primary.text)}
      >
        <FileText size={14} />
      </StatusBarItem>
      <StatusBarItem
        onClick={() => store.setSidebarMode('search')}
        className={className(searchActive && tw.primary.text)}
      >
        <Search size={14} />
      </StatusBarItem>
      <StatusBarItem
        onClick={() => store.setSidebarMode('git')}
        className={className(gitActive && tw.primary.text)}
      >
        <GitBranch size={14} />
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
