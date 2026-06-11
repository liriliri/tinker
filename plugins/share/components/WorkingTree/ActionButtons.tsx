import { type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, FolderOpen, Minus, Plus, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tw } from '../../theme'
import {
  WORKING_TREE_ACTION_BUTTON_CLASS,
  type WorkingTreeActionId,
  type WorkingTreeFileAction,
} from '../../lib/workingTree'
import type { WorkingTreeRevealIcon } from './context'
import { WORKING_TREE_NS } from './i18n'

const ACTION_ICONS: Record<WorkingTreeActionId, LucideIcon> = {
  stage: Plus,
  unstage: Minus,
  discard: RotateCcw,
  reveal: FolderOpen,
}

const REVEAL_ICONS: Record<WorkingTreeRevealIcon, LucideIcon> = {
  folder: FolderOpen,
  file: FileText,
}

export interface ActionButtonsProps {
  actions: WorkingTreeFileAction[]
  onAction: (actionId: WorkingTreeActionId) => void | Promise<void>
  className?: string
  revealIcon?: WorkingTreeRevealIcon
}

export default function ActionButtons({
  actions,
  onAction,
  className = 'hidden group-hover:flex items-center gap-0.5',
  revealIcon = 'folder',
}: ActionButtonsProps) {
  const { t } = useTranslation(WORKING_TREE_NS)

  return (
    <div className={className}>
      {actions.map((action) => {
        const Icon =
          action.id === 'reveal'
            ? REVEAL_ICONS[revealIcon]
            : ACTION_ICONS[action.id]
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
