import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import DiagramEditor from './components/DiagramEditor'
import DiagramPreview from './components/DiagramPreview'
import Toolbar from './components/Toolbar'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  return (
    <AlertProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />

        <div className="flex-1 overflow-hidden flex">
          {(store.viewMode === 'split' || store.viewMode === 'editor') && (
            <div
              className={className(
                'flex-1 min-w-0',
                store.viewMode === 'split' && ['border-r', tw.border]
              )}
            >
              <DiagramEditor />
            </div>
          )}

          {(store.viewMode === 'split' || store.viewMode === 'preview') && (
            <div className="flex-1 min-w-0">
              <DiagramPreview />
            </div>
          )}
        </div>
      </div>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
