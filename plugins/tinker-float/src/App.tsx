import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import { ToasterProvider } from 'share/components/Toaster'
import Toolbar from './components/Toolbar'
import Preview from './components/Preview'

export default observer(function App() {
  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />
        <Preview />
      </div>
    </ToasterProvider>
  )
})
