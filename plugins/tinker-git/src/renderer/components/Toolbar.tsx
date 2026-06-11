import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, GitBranch } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSearch,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Select from 'share/components/Select'
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
            className="flex items-center gap-1.5 max-w-32 min-w-0"
          >
            <GitBranch size={14} className="shrink-0" />
            <span className="truncate font-mono">
              {store.selectedCommit.shortSha}
            </span>
          </ToolbarButton>
          <div className="flex-1 min-w-0 truncate text-xs">
            {store.selectedCommit.summary}
          </div>
          <div className="w-28 shrink-0 truncate text-xs text-right">
            {store.selectedCommit.author}
          </div>
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
          <ToolbarSpacer />
          <ToolbarSearch
            value={store.commitSearchQuery}
            onChange={(value) => store.setCommitSearchQuery(value)}
            placeholder={t('searchCommits')}
            className="ml-0"
          />
          <Select
            value={store.commitAuthorFilter}
            onChange={(value) => store.setCommitAuthorFilter(value)}
            onFocus={() => void store.ensureAuthorsLoaded()}
            options={[
              {
                label:
                  store.loadingAuthors && store.authors.length === 0
                    ? t('loading')
                    : t('allAuthors'),
                value: '',
              },
              ...store.authors.map((author) => ({
                label: author,
                value: author,
              })),
            ]}
            title={t('filterByAuthor')}
            className="w-28 shrink-0"
          />
        </>
      )}

      <BranchSelectDialog
        open={showBranchDialog}
        onClose={() => setShowBranchDialog(false)}
      />
    </Toolbar>
  )
})
