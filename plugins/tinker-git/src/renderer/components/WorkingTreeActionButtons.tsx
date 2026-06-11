import { type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Minus, Plus, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tw } from 'share/theme'
import {
  WORKING_TREE_ACTION_BUTTON_CLASS,
  type WorkingTreeActionId,
  type WorkingTreeFileAction,
} from '../lib/workingTree'

const ACTION_ICONS: Record<WorkingTreeActionId, LucideIcon> = {
  stage: Plus,
  unstage: Minus,
  discard: RotateCcw,
  reveal: FolderOpen,
}

export interface WorkingTreeActionButtonsProps {
  actions: WorkingTreeFileAction[]
  onAction: (actionId: WorkingTreeActionId) => void | Promise<void>
  className?: string
}

export default function WorkingTreeActionButtons({
  actions,
  onAction,
  className = 'hidden group-hover:flex items-center gap-0.5',
}: WorkingTreeActionButtonsProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      {actions.map((action) => {
        const Icon = ACTION_ICONS[action.id]
        return (
          <button
            key={action.id}
            type="button"
            className={`${WORKING_TREE_ACTION_BUTTON_CLASS} ${tw.activeFeedback}`}
            title={t(action.titleKey)}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation()
              void onAction(action.id)
            }}
          >
            <Icon size={14} className={tw.text.secondary} />
          </button>
        )
      })}
    </div>
  )
}
