import { observer } from 'mobx-react-lite'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import Toolbar from './components/Toolbar'
import AppList from './components/AppList'
import AppDialog from './components/AppDialog'
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
          <AppList />
          <AppDialog />
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
