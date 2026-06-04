import { makeAutoObservable, runInAction } from 'mobx'
import type { ITreeNode } from 'share/components/FileTree/types'
import type {
  GitBlameHunk,
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

  // File browsing state
  browsingFiles = false
  treeNodes: ITreeNode[] = []
  selectedFilePath = ''
  fileContent = ''
  loadingFileContent = false

  // Blame state
  blameHunks: GitBlameHunk[] = []
  showingBlame = false
  loadingBlame = false
  highlightedBlameSha: string | null = null

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
    this.setBrowsingFiles(false)
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

  async setBrowsingFiles(on: boolean) {
    this.browsingFiles = on
    if (!on) {
      this.selectedFilePath = ''
      this.fileContent = ''
      this.treeNodes = []
      return
    }

    if (!this.selectedCommit) return

    try {
      await this.syncPreloadRepo()
      const nodes = await git.getCommitTree(this.selectedCommit.sha)
      runInAction(() => {
        this.treeNodes = nodes
      })
    } catch (err) {
      console.error('Failed to load commit tree:', err)
    }
  }

  async openFile(filePath: string) {
    if (!this.selectedCommit) return
    if (this.selectedFilePath === filePath) return

    this.selectedFilePath = filePath
    this.loadingFileContent = true
    this.showingBlame = false
    this.blameHunks = []

    try {
      await this.syncPreloadRepo()
      const content = await git.getCommitFileContent(
        this.selectedCommit.sha,
        filePath
      )
      runInAction(() => {
        this.fileContent = content
      })
    } catch (err) {
      console.error('Failed to load file content:', err)
      runInAction(() => {
        this.fileContent = `// Failed to load: ${err}`
      })
    } finally {
      runInAction(() => {
        this.loadingFileContent = false
      })
    }
  }

  get blameLineAnnotations(): Array<{
    lineNumber: number
    isLeader: boolean
    sha: string
    text: string
    date: string
  }> {
    if (this.blameHunks.length === 0) return []

    const annotations: Array<{
      lineNumber: number
      isLeader: boolean
      sha: string
      text: string
      date: string
    }> = []

    for (const hunk of this.blameHunks) {
      const shortMsg =
        hunk.message.length > 32
          ? hunk.message.slice(0, 32) + '\u2026'
          : hunk.message
      const dateShort = hunk.date.slice(0, 10).replace(/-/g, '')
      const text = `\u00A0${hunk.author}\u00A0${shortMsg}\u00A0`

      annotations.push({
        lineNumber: hunk.startLineNumber,
        isLeader: true,
        sha: hunk.sha,
        text,
        date: dateShort,
      })

      for (let i = 1; i < hunk.lineCount; i++) {
        annotations.push({
          lineNumber: hunk.startLineNumber + i,
          isLeader: false,
          sha: hunk.sha,
          text: '',
          date: '',
        })
      }
    }

    return annotations
  }

  setHighlightedBlameSha(sha: string | null) {
    this.highlightedBlameSha = this.highlightedBlameSha === sha ? null : sha
  }

  async toggleBlame() {
    if (this.showingBlame) {
      this.showingBlame = false
      return
    }

    this.loadingBlame = true
    try {
      await this.syncPreloadRepo()
      const hunks = await git.getCommitFileBlame(
        this.selectedCommit!.sha,
        this.selectedFilePath
      )
      runInAction(() => {
        this.blameHunks = hunks
        this.showingBlame = true
      })
    } catch (err) {
      console.error('Failed to load blame:', err)
    } finally {
      runInAction(() => {
        this.loadingBlame = false
      })
    }
  }
}

export default RepoTab
