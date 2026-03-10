import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import TextEditor from './components/TextEditor'
import Toolbar from './components/Toolbar'
import ConfigFileList from './components/ConfigFileList'
import store from './store'

const SIDEBAR_OPEN_STYLE: React.CSSProperties = { width: 160 }
const SIDEBAR_CLOSED_STYLE: React.CSSProperties = { width: 0 }

export default observer(function App() {
  return (
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <Toolbar />
      <div className="flex flex-1 min-h-0">
        <div
          className={`shrink-0 transition-all duration-200 overflow-hidden ${
            store.sidebarOpen ? '' : 'w-0'
          }`}
          style={store.sidebarOpen ? SIDEBAR_OPEN_STYLE : SIDEBAR_CLOSED_STYLE}
        >
          <ConfigFileList />
        </div>
        <div className="flex-1 min-w-0">
          <TextEditor />
        </div>
      </div>
    </div>
  )
})
