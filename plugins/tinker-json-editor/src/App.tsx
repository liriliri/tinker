import { observer } from 'mobx-react-lite'
import TextEditor from './components/TextEditor'
import TreeEditor from './components/TreeEditor'
import Toolbar from './components/Toolbar'
import store from './store'
import { useDarkMode } from './hooks/useDarkMode'

const App = observer(() => {
  const isDark = useDarkMode()

  return (
    <div className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133]">
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e]">
        {store.mode === 'text' ? (
          <TextEditor isDark={isDark} />
        ) : (
          <TreeEditor />
        )}
      </div>
    </div>
  )
})

export default App
