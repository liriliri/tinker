import { observer } from 'mobx-react-lite'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ActionList from './components/ActionList'
import ActionDialog from './components/ActionDialog'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  return (
    <ConfirmProvider>
      <ToasterProvider>
        <div
          className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
        >
          <Toolbar />
          <OverlayScrollbars defer className="flex-1 min-h-0">
            <div className="p-3">
              <ActionList />
            </div>
          </OverlayScrollbars>
          <ActionDialog />
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
