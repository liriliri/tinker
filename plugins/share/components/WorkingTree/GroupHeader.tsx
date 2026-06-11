import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { confirm } from '../Confirm'
import { tw } from '../../theme'
import {
  getWorkingTreeGroupActions,
  WORKING_TREE_GROUP_I18N,
  type WorkingTreeActionId,
  type WorkingTreeDisplayGroup,
} from '../../lib/workingTree'
import ActionButtons from './ActionButtons'
import { useWorkingTreeContext } from './context'
import { WORKING_TREE_NS } from './i18n'

export interface GroupHeaderProps {
  group: WorkingTreeDisplayGroup
  fileCount: number
  collapsed: boolean
  onToggle: () => void
}

export default function GroupHeader({
  group,
  fileCount,
  collapsed,
  onToggle,
}: GroupHeaderProps) {
  const { t } = useTranslation(WORKING_TREE_NS)
  const { onStageGroup, onUnstageGroup, onDiscardGroup } =
    useWorkingTreeContext()
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
      await onDiscardGroup(group)
      return
    }

    if (actionId === 'stage') {
      await onStageGroup(group)
      return
    }

    if (actionId === 'unstage') {
      await onUnstageGroup()
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
        <ActionButtons actions={actions} onAction={handleAction} />
      </div>
    </div>
  )
}
