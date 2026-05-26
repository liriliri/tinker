import { observer } from 'mobx-react-lite'
import { PanelLeft, PanelLeftClose, FolderOpen, Terminal } from 'lucide-react'
import {
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
} from 'share/components/StatusBar'
import store from '../store'

export default observer(function StatusBarComponent() {
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
      <StatusBarItem onClick={() => store.toggleTerminal()}>
        <Terminal size={14} />
      </StatusBarItem>
    </StatusBar>
  )
})
