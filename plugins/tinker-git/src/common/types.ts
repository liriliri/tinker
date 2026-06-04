export type GitRefKind = 'local' | 'remote' | 'tag'

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

export interface OpenRepositoryResult {
  repoPath: string
  headRef: string
}
