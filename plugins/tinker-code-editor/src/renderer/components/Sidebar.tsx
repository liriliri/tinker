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
import store from '../store'
import FileTree from './FileTree'

export default observer(function Sidebar() {
  const { t } = useTranslation()

  if (!store.sidebarOpen) return null

  if (store.sidebarMode === 'search') {
    return (
      <div className={`relative z-10 h-full ${tw.bg.tertiary}`}>
        <TextSearchSidebar
          {...getTextSearchUIProps(store.textSearch)}
          onSelectMatch={store.selectSearchMatch}
          showFolderPicker={false}
        />
      </div>
    )
  }

  if (store.sidebarMode === 'git') {
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
  }

  return (
    <div className={`relative z-10 h-full flex flex-col ${tw.bg.tertiary}`}>
      <div className="flex-1 overflow-y-auto">
        <FileTree />
      </div>
    </div>
  )
})
