import { observer } from 'mobx-react-lite'
import TextSearchSidebar, {
  getTextSearchUIProps,
} from 'share/components/TextSearch'
import { tw } from 'share/theme'
import store from '../store'
import FileTree from './FileTree'

export default observer(function Sidebar() {
  if (!store.sidebarOpen) return null

  if (store.sidebarMode === 'search') {
    return (
      <div className={`relative z-10 h-full ${tw.bg.tertiary}`}>
        <TextSearchSidebar
          {...getTextSearchUIProps(store.textSearch)}
          onSelectMatch={store.selectSearchMatch}
          showFolderPicker={false}
        />
      </div>
    )
  }

  return (
    <div className={`relative z-10 h-full flex flex-col ${tw.bg.tertiary}`}>
      <div className="flex-1 overflow-y-auto">
        <FileTree />
      </div>
    </div>
  )
})
