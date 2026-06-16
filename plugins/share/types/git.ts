export type GitRefKind = 'local' | 'remote' | 'tag'

export interface OpenRepositoryResult {
  repoPath: string
  headRef: string
}

export interface GitBranch {
  name: string
  fullName: string
  kind: GitRefKind
  isRemote: boolean
  isHead: boolean
  sha: string
}

export interface GitCommitSummary {
  sha: string
  shortSha: string
  summary: string
  author: string
  email: string
  date: number
}

export interface GitCommitDetail extends GitCommitSummary {
  body: string
  message: string
  diff: string
}

export interface GitBlameHunk {
  sha: string
  author: string
  message: string
  dateMs: number
  startLineNumber: number
  lineCount: number
}

export interface CommitTreeEntry {
  name: string
  path: string
  isDirectory: boolean
}

export type GitWorkingTreeGroup = 'merge' | 'staged' | 'changes' | 'untracked'

export type GitWorkingTreeStatus =
  | 'index-modified'
  | 'index-added'
  | 'index-deleted'
  | 'index-renamed'
  | 'index-copied'
  | 'modified'
  | 'deleted'
  | 'untracked'
  | 'intent-to-add'
  | 'intent-to-rename'
  | 'type-changed'
  | 'conflict'
  | 'submodule-dirty'

export interface GitWorkingTreeFile {
  id: string
  path: string
  renameFrom?: string
  status: GitWorkingTreeStatus
  group: GitWorkingTreeGroup
  statusLetter: string
}

export interface GitCheckoutInfo {
  isDetached: boolean
  branchName: string | null
  shortSha: string
  sha: string
  summary: string | null
}

export interface GitWorkingTreeStatusResult {
  checkout: GitCheckoutInfo
  files: GitWorkingTreeFile[]
}

export interface GitWorkingTreeFileDiffContent {
  original: string
  modified: string
  isBinary: boolean
  isTooLarge: boolean
}
