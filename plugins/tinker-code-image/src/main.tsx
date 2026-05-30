import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import Frame from './components/Frame'
import Toolbar from './components/Toolbar'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  return (
    <div className={`h-screen flex flex-col overflow-hidden ${tw.bg.primary}`}>
      <Toolbar />
      <div className="flex-1 min-h-0">
        <Frame />
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
