import { observer } from 'mobx-react-lite'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import PdfViewer from './components/PdfViewer'
import Sidebar from './components/Sidebar'

export default observer(function App() {
  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
      >
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <PdfViewer />
        </div>
      </div>
    </ToasterProvider>
  )
})
