import { observer } from 'mobx-react-lite'
import Toolbar from './components/Toolbar'
import QRGenerator from './components/QRGenerator'

export default observer(function App() {
  return (
    <div className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133]">
      <Toolbar />

      <div className="flex-1 overflow-hidden">
        <QRGenerator />
      </div>
    </div>
  )
})
