import { observer } from 'mobx-react-lite'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import PhotoToolbar from './components/Toolbar'
import PhotoGallery from './components/PhotoGallery'
import PhotoViewer from './components/PhotoViewer'
import ScanDirsModal from './components/ScanDirsModal'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  return (
    <ToasterProvider>
      <ConfirmProvider>
        <PromptProvider>
          <div
            className={`relative flex h-screen flex-col overflow-hidden ${tw.bg.primary}`}
          >
            <PhotoToolbar />

            <div className="flex-1 overflow-hidden">
              <PhotoGallery />
            </div>

            <PhotoViewer />
            <ScanDirsModal />
          </div>
        </PromptProvider>
      </ConfirmProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
