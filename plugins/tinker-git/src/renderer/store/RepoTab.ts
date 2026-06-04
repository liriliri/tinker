import { makeAutoObservable, runInAction } from 'mobx'
import type {
  GitBranch,
  GitCommitSummary,
  GitCommitDetail,
} from '../../common/types'

const COMMITS_PAGE_SIZE = 50

class RepoTab {
  id: string
  title = ''
  repoPath = ''
  branches: GitBranch[] = []
  commits: GitCommitSummary[] = []
  selectedBranch: GitBranch | null = null
  selectedCommit: GitCommitSummary | null = null
  commitDetail: GitCommitDetail | null = null
  editorContent = ''
  loading = false
  loadingCommits = false
  loadingMoreCommits = false
  hasMoreCommits = false
  loadingDetail = false
  error: string | null = null

  constructor(id: string) {
    this.id = id
    makeAutoObservable(this)
  }

  setError(msg: string | null) {
    this.error = msg
  }

  async syncPreloadRepo() {
    if (!this.repoPath) return
    if (git.getRepoPath() === this.repoPath) return
    await git.openRepository(this.repoPath)
  }

  async selectBranch(branch: GitBranch) {
    this.selectedBranch = branch
    this.selectedCommit = null
    this.commitDetail = null
    this.editorContent = ''
    await this.loadCommits(branch.fullName)
  }

  async loadCommits(refName: string) {
    this.loadingCommits = true
    this.hasMoreCommits = false
    this.setError(null)

    try {
      await this.syncPreloadRepo()
      const commits = await git.getCommits(refName, COMMITS_PAGE_SIZE, 0)
      this.commits = commits
      this.hasMoreCommits = commits.length === COMMITS_PAGE_SIZE
      if (commits.length > 0) {
        await this.selectCommit(commits[0])
      }
    } catch (err) {
      console.error('Failed to load commits:', err)
      runInAction(() => {
        this.setError(String(err))
        this.commits = []
        this.hasMoreCommits = false
      })
    } finally {
      this.loadingCommits = false
    }
  }

  async loadMoreCommits() {
    if (
      !this.selectedBranch ||
      !this.hasMoreCommits ||
      this.loadingCommits ||
      this.loadingMoreCommits
    ) {
      return
    }

    this.loadingMoreCommits = true
    this.setError(null)

    try {
      await this.syncPreloadRepo()
      const commits = await git.getCommits(
        this.selectedBranch.fullName,
        COMMITS_PAGE_SIZE,
        this.commits.length
      )
      this.commits.push(...commits)
      if (commits.length < COMMITS_PAGE_SIZE) {
        this.hasMoreCommits = false
      }
    } catch (err) {
      console.error('Failed to load more commits:', err)
      runInAction(() => {
        this.setError(String(err))
      })
    } finally {
      this.loadingMoreCommits = false
    }
  }

  async selectCommit(commit: GitCommitSummary) {
    this.selectedCommit = commit
    this.loadingDetail = true
    this.setError(null)

    try {
      await this.syncPreloadRepo()
      const detail = await git.getCommitDetail(commit.sha)
      runInAction(() => {
        this.commitDetail = detail
        this.editorContent = detail.diff
      })
    } catch (err) {
      console.error('Failed to load commit detail:', err)
      runInAction(() => {
        this.setError(String(err))
        this.commitDetail = null
        this.editorContent = ''
      })
    } finally {
      this.loadingDetail = false
    }
  }
}

export default RepoTab
