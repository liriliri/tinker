import { observer } from 'mobx-react-lite'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ResultDisplay from './components/ResultDisplay'

export default observer(function App() {
  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <ResultDisplay />
          </div>
        </div>
      </div>
    </ToasterProvider>
  )
})
