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

export interface IRepoTab {
  id: string
  title: string
  repoPath: string
  branches: GitBranch[]
  commits: GitCommitSummary[]
  selectedBranch: GitBranch | null
  selectedCommit: GitCommitSummary | null
  commitDetail: GitCommitDetail | null
  editorContent: string
  loading: boolean
  loadingCommits: boolean
  loadingDetail: boolean
  error: string | null
}
