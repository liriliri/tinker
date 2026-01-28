import { observer } from 'mobx-react-lite'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import RecorderControls from './components/RecorderControls'

export default observer(function App() {
  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.both.secondary}`}
      >
        <RecorderControls />
      </div>
    </ToasterProvider>
  )
})
