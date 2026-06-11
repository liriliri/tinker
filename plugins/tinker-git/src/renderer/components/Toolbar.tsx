import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  GitBranch,
  GitCommit,
  GitCompare,
  RotateCw,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarSearch,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import { formatRefLabel } from '../lib/util'
import BranchSelectDialog from './BranchSelectDialog'
import store from '../store'

const TOOLBAR_BRANCH_WIDTH_CLASS = 'w-40 max-w-40 min-w-0 shrink-0'
const TOOLBAR_BRANCH_INNER_CLASS = `flex items-center gap-1.5 ${TOOLBAR_BRANCH_WIDTH_CLASS}`

function ToolbarBranchContent({ label }: { label: string }) {
  return (
    <>
      <GitBranch size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </>
  )
}

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [showBranchDialog, setShowBranchDialog] = useState(false)

  const selectedBranch = store.selectedBranch
  const checkoutInfo = store.checkoutInfo

  return (
    <Toolbar>
      <ToolbarButton
        onClick={() => store.openRepositoryDialog()}
        title={t('openRepo')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      {store.repoPath && (
        <ToolbarButtonGroup>
          <ToolbarButton
            variant="toggle"
            active={store.viewMode === 'history'}
            onClick={() => void store.setViewMode('history')}
            title={t('historyMode')}
            className={`rounded-none rounded-l border-r ${tw.border}`}
          >
            <GitCommit size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton
            variant="toggle"
            active={store.viewMode === 'workingTree'}
            onClick={() => void store.setViewMode('workingTree')}
            title={t('workingTreeMode')}
            className="rounded-none rounded-r"
          >
            <GitCompare size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </ToolbarButtonGroup>
      )}

      {store.repoPath && store.viewMode === 'workingTree' && (
        <>
          <div
            className={`${TOOLBAR_BRANCH_INNER_CLASS} p-1.5 rounded text-xs ${tw.text.primary}`}
            title={
              checkoutInfo?.isDetached
                ? checkoutInfo.summary || checkoutInfo.shortSha
                : checkoutInfo?.branchName || ''
            }
          >
            <ToolbarBranchContent
              label={
                checkoutInfo?.isDetached
                  ? checkoutInfo.shortSha
                  : checkoutInfo?.branchName || t('loading')
              }
            />
          </div>
          {checkoutInfo?.isDetached && checkoutInfo.summary && (
            <div className="flex-1 min-w-0 truncate text-xs">
              {checkoutInfo.summary}
            </div>
          )}
          <ToolbarSpacer />
          <ToolbarButton
            onClick={() => void store.refreshWorkingTree()}
            disabled={store.loadingWorkingTree}
            title={t('refreshChanges')}
          >
            <RotateCw size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </>
      )}

      {store.repoPath &&
        store.viewMode === 'history' &&
        store.browsingFiles &&
        store.selectedCommit && (
          <>
            <ToolbarButton
              onClick={() => setShowBranchDialog(true)}
              title={t('branches')}
              className={TOOLBAR_BRANCH_INNER_CLASS}
            >
              <ToolbarBranchContent label={store.selectedCommit.shortSha} />
            </ToolbarButton>
            <div className="flex-1 min-w-0 truncate text-xs">
              {store.selectedCommit.summary}
            </div>
            <div className="w-28 shrink-0 truncate text-xs text-right">
              {store.selectedCommit.author}
            </div>
          </>
        )}

      {store.repoPath &&
        store.viewMode === 'history' &&
        store.branches.length > 0 &&
        !store.browsingFiles && (
          <>
            <ToolbarButton
              onClick={() => setShowBranchDialog(true)}
              disabled={store.loading}
              title={t('branches')}
              className={TOOLBAR_BRANCH_INNER_CLASS}
            >
              <ToolbarBranchContent
                label={
                  selectedBranch
                    ? formatRefLabel(selectedBranch.name, selectedBranch.isHead)
                    : t('branches')
                }
              />
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
