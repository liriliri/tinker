import { observer } from 'mobx-react-lite'
import DiffEditor from './components/DiffEditor'
import DualEditor from './components/DualEditor'
import Toolbar from './components/Toolbar'
import store from './store'

const App = observer(() => {
  return (
    <div className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133]">
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e]">
        {store.mode === 'edit' ? <DualEditor /> : <DiffEditor />}
      </div>
    </div>
  )
})

export default App
