import type {
  GitCheckoutInfo,
  GitWorkingTreeFile,
  GitWorkingTreeGroup,
  GitWorkingTreeStatus,
} from '../types/git'
import { joinPath } from './util'

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

export function isRenameWorkingTreeFile(file: GitWorkingTreeFile): boolean {
  return (
    file.status === 'index-renamed' ||
    file.status === 'intent-to-rename' ||
    file.status === 'index-copied'
  )
}

export function workingTreeFilePathLabel(file: GitWorkingTreeFile): string {
  return file.renameFrom ? `${file.renameFrom} → ${file.path}` : file.path
}

export function findWorkingTreeFile(
  files: GitWorkingTreeFile[],
  target: Pick<GitWorkingTreeFile, 'path' | 'group'>
): GitWorkingTreeFile | undefined {
  return files.find(
    (file) => file.path === target.path && file.group === target.group
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

export function isSubmoduleWorkingTreeFile(
  file: Pick<GitWorkingTreeFile, 'status'>
): boolean {
  return file.status === 'submodule-dirty'
}

export interface WorkingTreeDiscardBatch {
  paths: string[]
  group: GitWorkingTreeGroup
  status?: GitWorkingTreeStatus
}

export function getWorkingTreeDiscardBatches(
  files: GitWorkingTreeFile[],
  group: WorkingTreeDisplayGroup
): WorkingTreeDiscardBatch[] {
  if (group === 'changes') {
    const sectionFiles = files.filter(
      (file) => file.group === 'changes' || file.group === 'untracked'
    )
    const batches: WorkingTreeDiscardBatch[] = []
    const submodulePaths = sectionFiles
      .filter(isSubmoduleWorkingTreeFile)
      .map((file) => file.path)
    const trackedPaths = sectionFiles
      .filter(
        (file) => file.group === 'changes' && !isSubmoduleWorkingTreeFile(file)
      )
      .map((file) => file.path)
    const untrackedPaths = sectionFiles
      .filter((file) => file.group === 'untracked')
      .map((file) => file.path)

    if (submodulePaths.length > 0) {
      batches.push({
        paths: submodulePaths,
        group: 'changes',
        status: 'submodule-dirty',
      })
    }
    if (trackedPaths.length > 0) {
      batches.push({ paths: trackedPaths, group: 'changes' })
    }
    if (untrackedPaths.length > 0) {
      batches.push({ paths: untrackedPaths, group: 'untracked' })
    }
    return batches
  }

  if (group === 'staged') {
    const stagedFiles = files.filter((file) => file.group === 'staged')
    const batches: WorkingTreeDiscardBatch[] = []
    const submodulePaths = stagedFiles
      .filter(isSubmoduleWorkingTreeFile)
      .map((file) => file.path)
    const regularPaths = stagedFiles
      .filter((file) => !isSubmoduleWorkingTreeFile(file))
      .map((file) => file.path)

    if (submodulePaths.length > 0) {
      batches.push({
        paths: submodulePaths,
        group: 'staged',
        status: 'submodule-dirty',
      })
    }
    if (regularPaths.length > 0) {
      batches.push({ paths: regularPaths, group: 'staged' })
    }
    return batches
  }

  const paths = files
    .filter((file) => fileBelongsToDisplayGroup(file, group))
    .map((file) => file.path)
  return paths.length > 0 ? [{ paths, group }] : []
}

function compareWorkingTreeFiles(
  a: GitWorkingTreeFile,
  b: GitWorkingTreeFile
): number {
  const aIsSubmodule = isSubmoduleWorkingTreeFile(a)
  const bIsSubmodule = isSubmoduleWorkingTreeFile(b)
  if (aIsSubmodule !== bIsSubmodule) {
    return aIsSubmodule ? -1 : 1
  }
  return a.path.localeCompare(b.path)
}

export function groupWorkingTreeFiles(
  files: GitWorkingTreeFile[]
): WorkingTreeGroupSection[] {
  return WORKING_TREE_DISPLAY_GROUPS.map((group) => {
    const sectionFiles = files
      .filter((file) => fileBelongsToDisplayGroup(file, group))
      .sort(compareWorkingTreeFiles)

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
    case 'submodule-dirty':
      return 'text-blue-600 dark:text-blue-400'
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
  if (isSubmoduleWorkingTreeFile(file)) {
    switch (file.group) {
      case 'staged':
        return [{ id: 'unstage', titleKey: 'unstage' }]
      case 'changes':
        return [{ id: 'discard', titleKey: 'discard' }]
      default:
        return []
    }
  }
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

export interface WorkingTreeUIState {
  workingTreeFiles: GitWorkingTreeFile[]
  selectedWorkingTreeFileId: string | null
  loadingWorkingTree: boolean
  commitMessage: string
  branchName: string | null
  hasStagedChanges: boolean
  committing: boolean
  workingTreeMutating: boolean
  isDark: boolean
}

export interface WorkingTreeUIActions {
  onCommitMessageChange: (message: string) => void
  onCommit: () => void | Promise<void>
  onSelectFile: (file: GitWorkingTreeFile) => void | Promise<void>
  onStageFile: (file: GitWorkingTreeFile) => void | Promise<void>
  onUnstageFile: (file: GitWorkingTreeFile) => void | Promise<void>
  onDiscardFile: (file: GitWorkingTreeFile) => void | Promise<void>
  onRevealFile: (file: GitWorkingTreeFile) => void
  onStageGroup: (group: WorkingTreeDisplayGroup) => void | Promise<void>
  onUnstageGroup: () => void | Promise<void>
  onDiscardGroup: (group: WorkingTreeDisplayGroup) => void | Promise<void>
}

export interface WorkingTreeController {
  workingTreeFiles: GitWorkingTreeFile[]
  selectedWorkingTreeFile: GitWorkingTreeFile | null
  loadingWorkingTree: boolean
  commitMessage: string
  hasStagedChanges: boolean
  committing: boolean
  workingTreeMutating: boolean
  isDark: boolean
  repoPath: string
  checkoutInfo: GitCheckoutInfo | null
  setCommitMessage: (message: string) => void
  commitWorkingTree: () => void | Promise<void>
  selectWorkingTreeFile: (file: GitWorkingTreeFile) => void | Promise<void>
  stageWorkingTreeFile: (file: GitWorkingTreeFile) => void | Promise<void>
  unstageWorkingTreeFile: (file: GitWorkingTreeFile) => void | Promise<void>
  discardWorkingTreeFile: (file: GitWorkingTreeFile) => void | Promise<void>
  stageWorkingTreeGroup: (
    group: WorkingTreeDisplayGroup
  ) => void | Promise<void>
  unstageWorkingTreeGroup: () => void | Promise<void>
  discardWorkingTreeGroup: (
    group: WorkingTreeDisplayGroup
  ) => void | Promise<void>
}

/** Map a MobX controller to plain UI props. Call inside an observer. */
export function getWorkingTreeUIProps(
  source: WorkingTreeController
): WorkingTreeUIState & WorkingTreeUIActions {
  return {
    workingTreeFiles: source.workingTreeFiles,
    selectedWorkingTreeFileId: source.selectedWorkingTreeFile?.id ?? null,
    loadingWorkingTree: source.loadingWorkingTree,
    commitMessage: source.commitMessage,
    branchName: source.checkoutInfo?.branchName || null,
    hasStagedChanges: source.hasStagedChanges,
    committing: source.committing,
    workingTreeMutating: source.workingTreeMutating,
    isDark: source.isDark,
    onCommitMessageChange: (message) => source.setCommitMessage(message),
    onCommit: () => source.commitWorkingTree(),
    onSelectFile: (file) => source.selectWorkingTreeFile(file),
    onStageFile: (file) => source.stageWorkingTreeFile(file),
    onUnstageFile: (file) => source.unstageWorkingTreeFile(file),
    onDiscardFile: (file) => source.discardWorkingTreeFile(file),
    onRevealFile: (file) => {
      if (!source.repoPath) return
      tinker.showItemInPath(joinPath(source.repoPath, file.path))
    },
    onStageGroup: (group) => source.stageWorkingTreeGroup(group),
    onUnstageGroup: () => source.unstageWorkingTreeGroup(),
    onDiscardGroup: (group) => source.discardWorkingTreeGroup(group),
  }
}
