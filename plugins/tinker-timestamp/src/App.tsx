import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import Converter from './components/Converter'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  return (
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <Toolbar />

      {/* Main Content */}
      <div className={`flex-1 overflow-hidden ${tw.bg.primary}`}>
        <Converter />
      </div>
    </div>
  )
})
