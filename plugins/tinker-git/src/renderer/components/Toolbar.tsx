import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, GitBranch } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { formatRefLabel } from '../lib/util'
import BranchSelectDialog from './BranchSelectDialog'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [showBranchDialog, setShowBranchDialog] = useState(false)

  const selectedBranch = store.selectedBranch

  return (
    <Toolbar>
      <ToolbarButton
        onClick={() => store.openRepositoryDialog()}
        title={t('openRepo')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      {store.repoPath && store.browsingFiles && store.selectedCommit && (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() => setShowBranchDialog(true)}
            title={t('branches')}
            className="flex items-center gap-1.5 max-w-48 min-w-0"
          >
            <GitBranch size={14} className="shrink-0" />
            <span className="truncate font-mono">
              {store.selectedCommit.shortSha}
            </span>
          </ToolbarButton>
        </>
      )}

      {store.repoPath && store.branches.length > 0 && !store.browsingFiles && (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() => setShowBranchDialog(true)}
            disabled={store.loading}
            title={t('branches')}
            className="flex items-center gap-1.5 max-w-48 min-w-0"
          >
            <GitBranch size={14} className="shrink-0" />
            <span className="truncate">
              {selectedBranch
                ? formatRefLabel(selectedBranch.name, selectedBranch.isHead)
                : t('branches')}
            </span>
          </ToolbarButton>
        </>
      )}

      <BranchSelectDialog
        open={showBranchDialog}
        onClose={() => setShowBranchDialog(false)}
      />
    </Toolbar>
  )
})
