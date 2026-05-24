import { observer } from 'mobx-react-lite'
import renderApp from 'share/lib/renderApp'
import Terminal from './components/Terminal'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  return (
    <div className="h-full overflow-hidden">
      <Terminal />
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
