import { observer } from 'mobx-react-lite'
import TextEditor from './components/TextEditor'
import TreeEditor from './components/TreeEditor'
import Toolbar from './components/Toolbar'
import store from './store'
import { useDarkMode } from './hooks/useDarkMode'

const App = observer(() => {
  const isDark = useDarkMode()

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#1e1e1e]">
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
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
