import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import { tw } from 'share/theme'
import {
  getWorkingTreeGroupActions,
  WORKING_TREE_GROUP_I18N,
  type WorkingTreeActionId,
  type WorkingTreeDisplayGroup,
} from '../lib/workingTree'
import WorkingTreeActionButtons from './WorkingTreeActionButtons'
import store from '../store'

export interface WorkingTreeGroupHeaderProps {
  group: WorkingTreeDisplayGroup
  fileCount: number
  collapsed: boolean
  onToggle: () => void
}

export default observer(function WorkingTreeGroupHeader({
  group,
  fileCount,
  collapsed,
  onToggle,
}: WorkingTreeGroupHeaderProps) {
  const { t } = useTranslation()
  const actions = getWorkingTreeGroupActions(group)

  const handleAction = async (actionId: WorkingTreeActionId) => {
    if (actionId === 'discard') {
      const confirmed = await confirm({
        title: t('discardAllTitle'),
        message: t('discardAllMessage', {
          count: fileCount,
          group: t(WORKING_TREE_GROUP_I18N[group]),
        }),
        confirmText: t('discard'),
      })
      if (!confirmed) return
      await store.discardWorkingTreeGroup(group)
      return
    }

    if (actionId === 'stage') {
      await store.stageWorkingTreeGroup(group)
      return
    }

    if (actionId === 'unstage') {
      await store.unstageWorkingTreeGroup()
    }
  }

  return (
    <div
      className={`group flex items-center gap-1 px-2 py-1.5 text-xs font-medium min-w-0 ${tw.text.primary} ${tw.hover}`}
    >
      <button
        type="button"
        className="flex flex-1 items-center gap-1 min-w-0 text-left"
        onClick={onToggle}
      >
        {collapsed ? (
          <ChevronRight size={14} className="shrink-0" />
        ) : (
          <ChevronDown size={14} className="shrink-0" />
        )}
        <span className="truncate">{t(WORKING_TREE_GROUP_I18N[group])}</span>
      </button>

      <div className="shrink-0 flex items-center justify-end h-5 pr-0.5">
        <span
          className={`min-w-4 text-right group-hover:hidden ${tw.text.tertiary}`}
        >
          {fileCount}
        </span>
        <WorkingTreeActionButtons actions={actions} onAction={handleAction} />
      </div>
    </div>
  )
})
