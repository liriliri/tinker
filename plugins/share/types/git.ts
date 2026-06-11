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
