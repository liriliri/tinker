import type {
  GitWorkingTreeFile,
  GitWorkingTreeGroup,
  GitWorkingTreeStatus,
} from 'share/types/git'

export interface WorkingTreeGroupSection {
  group: WorkingTreeDisplayGroup
  files: GitWorkingTreeFile[]
}

export type WorkingTreeDisplayGroup = 'merge' | 'staged' | 'changes'

export const WORKING_TREE_DISPLAY_GROUPS: WorkingTreeDisplayGroup[] = [
  'merge',
  'staged',
  'changes',
]

export const WORKING_TREE_GROUP_I18N: Record<WorkingTreeDisplayGroup, string> =
  {
    merge: 'mergeChanges',
    staged: 'stagedChanges',
    changes: 'changes',
  }

export function getCommitShortcutLabel(): string {
  return isMacPlatform() ? '⌘↵' : 'Ctrl+Enter'
}

export function isCommitShortcutKey(event: {
  key: string
  metaKey: boolean
  ctrlKey: boolean
}): boolean {
  if (event.key !== 'Enter') return false
  return isMacPlatform() ? event.metaKey : event.ctrlKey
}

function isMacPlatform(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPod|iPad/.test(navigator.platform)
  )
}

export interface RefreshWorkingTreeOptions {
  showLoading?: boolean
  reloadDiff?: boolean
  selectPath?: string
  selectGroup?: GitWorkingTreeGroup
}

export function resolveWorkingTreeSelection(
  files: GitWorkingTreeFile[],
  current: GitWorkingTreeFile | null,
  hint?: Pick<RefreshWorkingTreeOptions, 'selectPath' | 'selectGroup'>
): GitWorkingTreeFile | null {
  if (hint?.selectPath) {
    if (hint.selectGroup) {
      const match = files.find(
        (file) =>
          file.path === hint.selectPath && file.group === hint.selectGroup
      )
      if (match) return match
    }
    return files.find((file) => file.path === hint.selectPath) ?? null
  }

  if (!current) return null

  const byId = files.find((file) => file.id === current.id)
  if (byId) return byId

  return files.find((file) => file.path === current.path) ?? null
}

export function isNewWorkingTreeFile(file: GitWorkingTreeFile): boolean {
  return (
    file.group === 'untracked' ||
    file.status === 'index-added' ||
    file.status === 'intent-to-add'
  )
}

export function fileBelongsToDisplayGroup(
  file: GitWorkingTreeFile,
  displayGroup: WorkingTreeDisplayGroup
): boolean {
  if (displayGroup === 'changes') {
    return file.group === 'changes' || file.group === 'untracked'
  }
  return file.group === displayGroup
}

export function groupWorkingTreeFiles(
  files: GitWorkingTreeFile[]
): WorkingTreeGroupSection[] {
  return WORKING_TREE_DISPLAY_GROUPS.map((group) => {
    const sectionFiles = files.filter((file) =>
      fileBelongsToDisplayGroup(file, group)
    )

    if (group === 'changes') {
      sectionFiles.sort((a, b) => a.path.localeCompare(b.path))
    }

    return { group, files: sectionFiles }
  }).filter((section) => section.files.length > 0)
}

export function statusLetterClass(status: GitWorkingTreeStatus): string {
  switch (status) {
    case 'index-modified':
    case 'modified':
    case 'type-changed':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'index-added':
    case 'intent-to-add':
    case 'untracked':
      return 'text-green-600 dark:text-green-400'
    case 'index-deleted':
    case 'deleted':
      return 'text-red-600 dark:text-red-400'
    case 'index-renamed':
    case 'index-copied':
    case 'intent-to-rename':
      return 'text-purple-600 dark:text-purple-400'
    case 'conflict':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-500 dark:text-gray-400'
  }
}

export function fileDisplayName(file: GitWorkingTreeFile): string {
  return file.path.split('/').pop() || file.path
}

export function fileDirectoryName(file: GitWorkingTreeFile): string {
  const parts = file.path.split('/')
  if (parts.length <= 1) return ''
  return parts.slice(0, -1).join('/')
}

export type WorkingTreeActionId = 'stage' | 'unstage' | 'discard' | 'reveal'

export interface WorkingTreeFileAction {
  id: WorkingTreeActionId
  titleKey: string
}

export const WORKING_TREE_ACTION_BUTTON_CLASS = `flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10`

export function getWorkingTreeGroupActions(
  group: WorkingTreeDisplayGroup
): WorkingTreeFileAction[] {
  switch (group) {
    case 'staged':
      return [{ id: 'unstage', titleKey: 'unstageAll' }]
    case 'merge':
    case 'changes':
      return [
        { id: 'stage', titleKey: 'stageAll' },
        { id: 'discard', titleKey: 'discardAll' },
      ]
    default:
      return []
  }
}

const UNSTAGED_FILE_ACTIONS: WorkingTreeFileAction[] = [
  { id: 'stage', titleKey: 'stage' },
  { id: 'discard', titleKey: 'discard' },
  { id: 'reveal', titleKey: 'revealInFolder' },
]

export function getWorkingTreeFileActions(
  file: GitWorkingTreeFile
): WorkingTreeFileAction[] {
  switch (file.group) {
    case 'staged':
      return [
        { id: 'unstage', titleKey: 'unstage' },
        { id: 'reveal', titleKey: 'revealInFolder' },
      ]
    case 'merge':
    case 'changes':
    case 'untracked':
      return UNSTAGED_FILE_ACTIONS
    default:
      return []
  }
}
