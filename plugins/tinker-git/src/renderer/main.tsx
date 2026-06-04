import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { ToasterProvider } from 'share/components/Toaster'
import FolderOpen from 'share/components/FolderOpen'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import store from './store'
import TabBar from './components/TabBar'
import Toolbar from './components/Toolbar'
import CommitList from './components/CommitList'
import CommitDetail from './components/CommitDetail'
import CommitFileTree from './components/CommitFileTree'
import CommitFileViewer from './components/CommitFileViewer'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const RepoPanels = observer(function RepoPanels() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['history', 'detail'],
    id: 'tinker-git-v3-layout',
    storage: localStorage,
  })

  const {
    defaultLayout: fileBrowserLayout,
    onLayoutChange: onFileBrowserLayoutChange,
  } = useDefaultLayout({
    panelIds: ['fileTree', 'fileViewer'],
    id: 'tinker-git-files-layout',
    storage: localStorage,
  })

  if (store.browsingFiles) {
    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <Group
          orientation="horizontal"
          className="h-full"
          defaultLayout={fileBrowserLayout}
          onLayoutChange={onFileBrowserLayoutChange}
        >
          <Panel id="fileTree" defaultSize="25%" minSize="18%">
            <CommitFileTree />
          </Panel>
          <Separator />
          <Panel id="fileViewer" minSize="60%">
            <CommitFileViewer />
          </Panel>
        </Group>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <Group
        orientation="horizontal"
        className="h-full"
        defaultLayout={defaultLayout}
        onLayoutChange={onLayoutChange}
      >
        <Panel id="history" defaultSize="32%" minSize="22%">
          <div className={`h-full overflow-hidden ${tw.bg.tertiary}`}>
            <CommitList />
          </div>
        </Panel>
        <Separator />
        <Panel id="detail" minSize="60%">
          <div className="h-full overflow-hidden">
            <CommitDetail />
          </div>
        </Panel>
      </Group>
    </div>
  )
})

const App = observer(function App() {
  const { t } = useTranslation()

  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col overflow-hidden ${tw.bg.primary}`}
      >
        <TabBar />
        <Toolbar />

        {store.error && (
          <div
            className={`px-4 py-2 text-sm border-b shrink-0 ${tw.border} text-red-500`}
          >
            {store.error}
          </div>
        )}

        {!store.repoPath ? (
          <FolderOpen
            onOpenFolder={(path) => store.openRepository(path)}
            openTitle={t('openRepo')}
            dropTitle={t('dropRepoHere')}
          />
        ) : (
          <RepoPanels />
        )}
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
