import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import PlayerBar from './components/PlayerBar'
import Playlist from './components/Playlist'
import RecentPlaylist from './components/RecentPlaylist'
import SheetPlaylist from './components/SheetPlaylist'
import Sidebar from './components/Sidebar'
import PlayQueue from './components/PlayQueue'
import MusicToolbar from './components/Toolbar'
import ListToolbar from './components/ListToolbar'
import LocalToolbar from './components/LocalToolbar'
import AddToSheetModal from './components/AddToSheetModal'
import MusicDetail from './components/MusicDetail'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import ScanDirsModal from 'share/components/ScanDirsModal'
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
  const { t } = useTranslation()

  return (
    <ToasterProvider>
      <PromptProvider>
        <div className="relative flex flex-col h-screen overflow-hidden">
          <MusicToolbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-hidden flex flex-col">
              {store.activeTab === 'local' ? <LocalToolbar /> : <ListToolbar />}
              <div className="flex-1 overflow-hidden">
                <MainContent />
              </div>
            </div>
          </div>
          <PlayerBar />
          <PlayQueue />
        </div>
        <MusicDetail />
        <AddToSheetModal />
        <ScanDirsModal
          open={store.showScanDialog}
          isDark={store.isDark}
          isScanning={store.isScanning}
          scanDirs={store.scanDirs}
          scanDirChecked={store.scanDirChecked}
          title={t('scanLocalMusic')}
          onClose={() => store.hideScanDialog()}
          onAddDir={(dir) => store.addScanDir(dir)}
          onRemoveDir={(dir) => store.removeScanDir(dir)}
          onToggleChecked={(dir) => store.toggleScanDirChecked(dir)}
          onScan={(dirs) => store.scanLocalMusic(dirs)}
        />
      </PromptProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
