import { observer } from 'mobx-react-lite'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import DualPanel from './components/DualPanel'

export default observer(function App() {
  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
      >
        <div className="flex-1 overflow-hidden">
          <DualPanel />
        </div>
      </div>
    </ToasterProvider>
  )
})
