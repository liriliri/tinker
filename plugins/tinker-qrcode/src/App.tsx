import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import QRGenerator from './components/QRGenerator'

export default observer(function App() {
  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
    >
      <Toolbar />

      <div className="flex-1 overflow-hidden">
        <QRGenerator />
      </div>
    </div>
  )
})
