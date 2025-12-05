import { observer } from 'mobx-react-lite'
import TextEditor from './components/TextEditor'
import TreeEditor from './components/TreeEditor'
import Toolbar from './components/Toolbar'
import store from './store'

const App = observer(() => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {store.mode === 'text' ? <TextEditor /> : <TreeEditor />}
      </div>
    </div>
  )
})

export default App
