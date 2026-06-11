import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { WorkingTreeDiffViewer as WorkingTreeDiffContent } from 'share/components/WorkingTree'
import CenteredMessage from './CenteredMessage'
import store from '../store'

export default observer(function WorkingTreeDiffViewer() {
  const { t } = useTranslation()

  return (
    <WorkingTreeDiffContent
      file={store.selectedWorkingTreeFile}
      diffContent={store.workingTreeDiffContent}
      loading={store.loadingWorkingTreeDiff}
      isDark={store.isDark}
      emptyState={<CenteredMessage>{t('selectChangeToView')}</CenteredMessage>}
    />
  )
})
