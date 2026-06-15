import { observer } from 'mobx-react-lite'
import { WorkingTreeDiffViewer } from 'share/components/WorkingTree'
import store from '../store'

interface GitDiffPaneProps {
  tabId: string
}

export default observer(function GitDiffPane({ tabId }: GitDiffPaneProps) {
  const tab = store.tabs.find((item) => item.id === tabId)
  if (!tab) return null

  return (
    <WorkingTreeDiffViewer
      file={tab.gitFile}
      diffContent={tab.diffContent}
      loading={tab.loadingDiff}
      isDark={store.isDark}
      headerVariant="none"
    />
  )
})
