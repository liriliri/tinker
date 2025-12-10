import { observer } from 'mobx-react-lite'
import Converter from './components/Converter'
import Toolbar from './components/Toolbar'

const App = observer(() => {
  return (
    <div className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133]">
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e]">
        <Converter />
      </div>
    </div>
  )
})

export default App
