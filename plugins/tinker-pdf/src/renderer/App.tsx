import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import PdfViewer from './components/PdfViewer'

export default observer(function App() {
  return (
    <AlertProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
      >
        <Toolbar />
        <PdfViewer />
      </div>
    </AlertProvider>
  )
})
