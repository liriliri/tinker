import { observer } from 'mobx-react-lite'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import QRGenerator from './components/QRGenerator'

export default observer(function App() {
  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.both.primary}`}>
        <Toolbar />

        <div className="flex-1 overflow-hidden">
          <QRGenerator />
        </div>
      </div>
    </ToasterProvider>
  )
})
