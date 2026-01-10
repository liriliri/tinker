import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import Converter from './components/Converter'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
    >
      <Toolbar />

      {/* Main Content */}
      <div
        className={`flex-1 overflow-hidden ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
      >
        <Converter />
      </div>
    </div>
  )
})
