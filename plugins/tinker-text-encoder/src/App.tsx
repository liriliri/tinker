import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import DualPanel from './components/DualPanel'

export default observer(function App() {
  return (
    <AlertProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
      >
        <div className="flex-1 overflow-hidden">
          <DualPanel />
        </div>
      </div>
    </AlertProvider>
  )
})
