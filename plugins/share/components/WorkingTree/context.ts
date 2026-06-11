import { createContext, useContext } from 'react'
import type {
  WorkingTreeUIActions,
  WorkingTreeUIState,
} from '../../lib/workingTree'

export type WorkingTreeRevealIcon = 'folder' | 'file'

export interface WorkingTreeContextValue
  extends WorkingTreeUIState,
    WorkingTreeUIActions {
  /** Override tooltip for the per-file reveal/open action. */
  revealTitleKey?: string
  /** Override icon for the per-file reveal/open action. */
  revealIcon?: WorkingTreeRevealIcon
}

export const WorkingTreeContext = createContext<WorkingTreeContextValue | null>(
  null
)

export function useWorkingTreeContext(): WorkingTreeContextValue {
  const ctx = useContext(WorkingTreeContext)
  if (!ctx) {
    throw new Error(
      'useWorkingTreeContext must be used inside <WorkingTreeSidebar>'
    )
  }
  return ctx
}
