import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ExpressionSection from './components/ExpressionSection'
import TextSection from './components/TextSection'

export default observer(function App() {
  return (
    <AlertProvider>
      <div
        className={`h-screen flex flex-col ${tw.bg.light.secondary} ${tw.bg.dark.secondary} transition-colors`}
      >
        <Toolbar />
        <ExpressionSection />
        <TextSection />
      </div>
    </AlertProvider>
  )
})
