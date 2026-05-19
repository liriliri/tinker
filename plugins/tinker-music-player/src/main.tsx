import { observer } from 'mobx-react-lite'
import PlayerBar from './components/PlayerBar'
import Playlist from './components/Playlist'
import MusicToolbar from './components/Toolbar'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <MusicToolbar />
      <div className="flex-1 overflow-hidden">
        <Playlist />
      </div>
      <PlayerBar />
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
