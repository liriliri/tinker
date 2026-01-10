import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import DiffEditor from './components/DiffEditor'
import DualEditor from './components/DualEditor'
import Toolbar from './components/Toolbar'
import store from './store'

export default observer(function App() {
  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
    >
      <Toolbar />

      {/* Main Content */}
      <div
        className={`flex-1 overflow-hidden ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
      >
        {store.mode === 'edit' ? <DualEditor /> : <DiffEditor />}
      </div>
    </div>
  )
})
