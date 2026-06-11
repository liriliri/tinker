import { makeAutoObservable, runInAction } from 'mobx'
import type { ITreeNode } from 'share/components/FileTree/types'
import { IMAGE_EXTS, getFileExt } from 'share/lib/fileType'
import debounce from 'licia/debounce'
import naturalSort from 'licia/naturalSort'
import type {
  GitBlameHunk,
  GitBranch,
  GitCommitSummary,
  GitCommitDetail,
} from 'share/types/git'

const COMMITS_PAGE_SIZE = 50
const SEARCH_DEBOUNCE_MS = 300

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
  fileCategory: 'text' | 'image' = 'text'
  loadingFileContent = false

  // Search state
  commitSearchQuery = ''
  commitAuthorFilter = ''
  authors: string[] = []
  loadingAuthors = false
  searching = false
  searchSkip = 0
  loadingMoreSearch = false

  private browseCommitsCache: {
    commits: GitCommitSummary[]
    hasMore: boolean
    selectedCommit: GitCommitSummary | null
  } | null = null

  // Blame state
  blameHunks: GitBlameHunk[] = []
  showingBlame = false
  loadingBlame = false
  highlightedBlameSha: string | null = null

  constructor(id: string) {
    this.id = id
    makeAutoObservable(this)
    this._doSearch = debounce(this._search.bind(this), SEARCH_DEBOUNCE_MS)
  }

  private searchRequestId = 0
  private authorsLoadId = 0
  private authorsBranch = ''
  private _doSearch: (query: string) => void

  private doSearch(query: string) {
    this._doSearch(query)
  }

  private async _search(query: string) {
    if (!this.selectedBranch) return

    const requestId = ++this.searchRequestId

    if (!query.trim() && !this.commitAuthorFilter.trim()) {
      this.searchSkip = 0
      if (this.browseCommitsCache) {
        runInAction(() => {
          this.commits = this.browseCommitsCache!.commits
          this.hasMoreCommits = this.browseCommitsCache!.hasMore
          this.selectedCommit = this.browseCommitsCache!.selectedCommit
          this.commitDetail = null
          this.editorContent = ''
        })
        if (this.selectedCommit) {
          await this.selectCommit(this.selectedCommit)
        }
        this.browseCommitsCache = null
        return
      }
      await this.loadCommits(this.selectedBranch.fullName)
      return
    }

    if (!this.browseCommitsCache) {
      this.browseCommitsCache = {
        commits: [...this.commits],
        hasMore: this.hasMoreCommits,
        selectedCommit: this.selectedCommit,
      }
    }

    this.searching = true
    this.setError(null)

    try {
      await this.syncPreloadRepo()
      const { commits: results, hasMore } = await git.searchCommits(
        this.selectedBranch.fullName,
        query,
        0,
        COMMITS_PAGE_SIZE,
        this.commitAuthorFilter.trim() || undefined
      )
      if (requestId !== this.searchRequestId) return
      runInAction(() => {
        this.searchSkip = results.length
        this.commits = results
        this.hasMoreCommits = hasMore
        if (results.length === 0) {
          this.selectedCommit = null
          this.commitDetail = null
          this.editorContent = ''
        }
      })
      if (requestId === this.searchRequestId && results.length > 0) {
        await this.selectCommit(results[0])
      }
    } catch (err) {
      if (requestId !== this.searchRequestId) return
      console.error('Failed to search commits:', err)
      this.setError(String(err))
    } finally {
      if (requestId === this.searchRequestId) {
        this.searching = false
      }
    }
  }

  setError(msg: string | null) {
    this.error = msg
  }

  setCommitSearchQuery(query: string) {
    this.commitSearchQuery = query
    this.doSearch(query)
  }

  setCommitAuthorFilter(author: string) {
    this.commitAuthorFilter = author
    this.doSearch(this.commitSearchQuery)
  }

  async ensureAuthorsLoaded() {
    if (!this.selectedBranch) return
    if (
      this.authors.length > 0 &&
      this.authorsBranch === this.selectedBranch.fullName
    ) {
      return
    }

    const loadId = ++this.authorsLoadId
    const branchName = this.selectedBranch.fullName

    this.loadingAuthors = true
    try {
      await this.syncPreloadRepo()
      const authors = await git.getAuthors(branchName)
      if (loadId !== this.authorsLoadId) return
      runInAction(() => {
        this.authors = naturalSort(authors)
        this.authorsBranch = branchName
      })
    } catch (err) {
      if (loadId !== this.authorsLoadId) return
      console.error('Failed to load authors:', err)
    } finally {
      if (loadId === this.authorsLoadId) {
        runInAction(() => {
          this.loadingAuthors = false
        })
      }
    }
  }

  async syncPreloadRepo(path?: string) {
    const targetPath = path || this.repoPath
    if (!targetPath) return
    if (!path && git.getRepoPath() === targetPath) return
    await git.openRepository(targetPath)
    this.repoPath = targetPath
  }

  async selectBranch(branch: GitBranch) {
    this.searchRequestId++
    this.authorsLoadId++
    this.setBrowsingFiles(false)
    this.selectedBranch = branch
    this.selectedCommit = null
    this.commitDetail = null
    this.editorContent = ''
    this.commitAuthorFilter = ''
    this.commitSearchQuery = ''
    this.browseCommitsCache = null
    this.searchSkip = 0
    this.authors = []
    this.authorsBranch = ''
    this.loadingAuthors = false
    await this.loadCommits(branch.fullName)
  }

  async loadCommits(refName: string) {
    this.loadingCommits = true
    this.hasMoreCommits = false
    this.browseCommitsCache = null
    this.searchSkip = 0
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
    await this.ensureAuthorsLoaded()
  }

  async loadMoreCommits() {
    const searching =
      this.commitSearchQuery.trim() !== '' ||
      this.commitAuthorFilter.trim() !== ''
    if (searching) {
      this.loadMoreSearchResults()
      return
    }

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

  private async loadMoreSearchResults() {
    if (
      !this.selectedBranch ||
      !this.hasMoreCommits ||
      this.loadingMoreSearch ||
      this.searching
    ) {
      return
    }

    this.loadingMoreSearch = true
    this.setError(null)

    try {
      await this.syncPreloadRepo()
      const { commits, hasMore } = await git.searchCommits(
        this.selectedBranch.fullName,
        this.commitSearchQuery,
        this.searchSkip,
        COMMITS_PAGE_SIZE,
        this.commitAuthorFilter.trim() || undefined
      )
      runInAction(() => {
        this.commits.push(...commits)
        this.searchSkip += commits.length
        this.hasMoreCommits = hasMore
      })
    } catch (err) {
      console.error('Failed to load more search results:', err)
      this.setError(String(err))
    } finally {
      runInAction(() => {
        this.loadingMoreSearch = false
      })
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
    this.commitSearchQuery = ''
    this.browseCommitsCache = null
    this.searchSkip = 0
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

    const ext = getFileExt(filePath)
    const isImage = IMAGE_EXTS.has(ext)
    this.fileCategory = isImage ? 'image' : 'text'

    try {
      await this.syncPreloadRepo()
      const content = isImage
        ? await git.getCommitFileContentBinary(
            this.selectedCommit.sha,
            filePath
          )
        : await git.getCommitFileContent(this.selectedCommit.sha, filePath)
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
    dateMs: number
  }> {
    if (this.blameHunks.length === 0) return []

    const annotations: Array<{
      lineNumber: number
      isLeader: boolean
      sha: string
      text: string
      dateMs: number
    }> = []

    for (const hunk of this.blameHunks) {
      const shortMsg =
        hunk.message.length > 32
          ? hunk.message.slice(0, 32) + '\u2026'
          : hunk.message
      const text = `\u00A0${hunk.author}\u00A0${shortMsg}\u00A0`

      annotations.push({
        lineNumber: hunk.startLineNumber,
        isLeader: true,
        sha: hunk.sha,
        text,
        dateMs: hunk.dateMs,
      })

      for (let i = 1; i < hunk.lineCount; i++) {
        annotations.push({
          lineNumber: hunk.startLineNumber + i,
          isLeader: false,
          sha: hunk.sha,
          text: '',
          dateMs: 0,
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
