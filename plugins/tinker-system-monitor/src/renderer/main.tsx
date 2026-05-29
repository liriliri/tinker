import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { ToasterProvider } from 'share/components/Toaster'
import { LoadingCircle } from 'share/components/Loading'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import Dashboard from './components/Dashboard'
import FloatOpened from './components/FloatOpened'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  if (store.isLoading && !store.payload) {
    return (
      <ToasterProvider>
        <AlertProvider>
          <div
            className={`h-screen flex items-center justify-center ${tw.bg.primary}`}
          >
            <LoadingCircle />
          </div>
        </AlertProvider>
      </ToasterProvider>
    )
  }

  return (
    <ToasterProvider>
      <AlertProvider>
        <div
          className={`h-screen flex flex-col ${tw.bg.primary} transition-colors`}
        >
          <Toolbar />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 min-h-0 flex flex-col">
            {store.floatOpen ? <FloatOpened /> : <Dashboard />}
          </div>
        </div>
      </AlertProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
