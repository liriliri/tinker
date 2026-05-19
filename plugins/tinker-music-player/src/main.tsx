import { observer } from 'mobx-react-lite'
import PlayerBar from './components/PlayerBar'
import Playlist from './components/Playlist'
import RecentPlaylist from './components/RecentPlaylist'
import SheetPlaylist from './components/SheetPlaylist'
import Sidebar from './components/Sidebar'
import PlayQueue from './components/PlayQueue'
import MusicToolbar from './components/Toolbar'
import { PromptProvider } from 'share/components/Prompt'
import renderApp from 'share/lib/renderApp'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const MainContent = observer(function MainContent() {
  switch (store.activeTab) {
    case 'recent':
      return <RecentPlaylist />
    case 'favorite':
    case 'sheet':
      return <SheetPlaylist key={store.activeSheetId} />
    default:
      return <Playlist />
  }
})

const App = observer(function App() {
  return (
    <PromptProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <MusicToolbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>
          {store.showPlayQueue && <PlayQueue />}
        </div>
        <PlayerBar />
      </div>
    </PromptProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
