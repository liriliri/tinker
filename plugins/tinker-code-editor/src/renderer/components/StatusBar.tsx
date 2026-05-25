import { observer } from 'mobx-react-lite'
import { PanelLeft, PanelLeftClose, FolderOpen } from 'lucide-react'
import { StatusBar, StatusBarItem } from 'share/components/StatusBar'
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
    </StatusBar>
  )
})
