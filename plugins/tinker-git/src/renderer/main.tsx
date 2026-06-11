import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import toast from 'react-hot-toast'
import { ToasterProvider } from 'share/components/Toaster'
import { ConfirmProvider } from 'share/components/Confirm'
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
import WorkingTreeSidebar, {
  getWorkingTreeUIProps,
} from 'share/components/WorkingTree'
import WorkingTreeDiffViewer from './components/WorkingTreeDiffViewer'
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

  const {
    defaultLayout: workingTreeLayout,
    onLayoutChange: onWorkingTreeLayoutChange,
  } = useDefaultLayout({
    panelIds: ['workingTreeSidebar', 'workingTreeDiff'],
    id: 'tinker-git-working-tree-layout',
    storage: localStorage,
  })

  if (store.viewMode === 'workingTree') {
    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <Group
          orientation="horizontal"
          className="h-full"
          defaultLayout={workingTreeLayout}
          onLayoutChange={onWorkingTreeLayoutChange}
        >
          <Panel id="workingTreeSidebar" defaultSize="28%" minSize="20%">
            <WorkingTreeSidebar {...getWorkingTreeUIProps(store)} />
          </Panel>
          <Separator />
          <Panel id="workingTreeDiff" minSize="55%">
            <WorkingTreeDiffViewer />
          </Panel>
        </Group>
      </div>
    )
  }

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

const ErrorToast = observer(function ErrorToast() {
  const { t } = useTranslation()

  useEffect(() => {
    if (store.error) {
      const msg =
        store.error === 'NOT_A_GIT_REPO' ? t('notAGitRepo') : store.error
      toast.error(msg)
    }
  }, [store.error, t])

  return null
})

const App = observer(function App() {
  const { t } = useTranslation()

  return (
    <ToasterProvider>
      <ConfirmProvider>
        <ErrorToast />
        <div
          className={`h-screen flex flex-col overflow-hidden ${tw.bg.primary}`}
        >
          <TabBar />
          <Toolbar />

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
      </ConfirmProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
