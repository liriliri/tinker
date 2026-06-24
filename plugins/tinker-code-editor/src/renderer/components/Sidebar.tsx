import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import TextSearchSidebar, {
  getTextSearchUIProps,
} from 'share/components/TextSearch'
import WorkingTreeSidebar, {
  getWorkingTreeUIProps,
} from 'share/components/WorkingTree'
import CenteredMessage from 'share/components/WorkingTree/CenteredMessage'
import { fileDisplayName } from 'share/lib/workingTree'
import { joinPath } from 'share/lib/util'
import { tw } from 'share/theme'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import store from '../store'
import FileTree from './FileTree'

const SearchPanel = observer(function SearchPanel() {
  return (
    <div className={`relative z-10 h-full ${tw.bg.tertiary}`}>
      <TextSearchSidebar
        {...getTextSearchUIProps(store.textSearch)}
        onSelectMatch={store.selectSearchMatch}
        showFolderPicker={false}
      />
    </div>
  )
})

const GitPanel = observer(function GitPanel() {
  const { t } = useTranslation()

  if (store.workingTree.resolvingGitRepo) {
    return (
      <div className={`relative z-10 h-full ${tw.bg.tertiary}`}>
        <CenteredMessage>{t('loadingGitRepo')}</CenteredMessage>
      </div>
    )
  }

  if (!store.workingTree.isGitRepo) {
    return (
      <div className={`relative z-10 h-full ${tw.bg.tertiary}`}>
        <CenteredMessage>{t('notAGitRepo')}</CenteredMessage>
      </div>
    )
  }

  return (
    <div className={`relative z-10 h-full ${tw.bg.tertiary}`}>
      <WorkingTreeSidebar
        {...getWorkingTreeUIProps(store.workingTree)}
        revealTitleKey="openInEditor"
        revealIcon="file"
        onRevealFile={(file) => {
          const repoPath = store.workingTree.repoPath
          if (!repoPath) return
          void store.openFile(
            joinPath(repoPath, file.path),
            fileDisplayName(file)
          )
        }}
      />
    </div>
  )
})

const ExplorerPanel = observer(function ExplorerPanel() {
  return (
    <div className={`relative z-10 h-full flex flex-col ${tw.bg.tertiary}`}>
      <OverlayScrollbars defer className="min-h-0 flex-1">
        <FileTree />
      </OverlayScrollbars>
    </div>
  )
})

export default observer(function Sidebar() {
  if (!store.sidebarOpen) return null

  return (
    <div className="h-full">
      <div className={store.sidebarMode !== 'search' ? 'hidden' : 'h-full'}>
        <SearchPanel />
      </div>
      <div className={store.sidebarMode !== 'git' ? 'hidden' : 'h-full'}>
        <GitPanel />
      </div>
      <div className={store.sidebarMode !== 'explorer' ? 'hidden' : 'h-full'}>
        <ExplorerPanel />
      </div>
    </div>
  )
})
