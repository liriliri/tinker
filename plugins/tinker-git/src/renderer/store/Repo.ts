import { makeAutoObservable, runInAction } from 'mobx'
import type { ITreeNode } from 'share/components/FileTree/types'
import { IMAGE_EXTS, getFileExt } from 'share/lib/fileType'
import debounce from 'licia/debounce'
import naturalSort from 'licia/naturalSort'
import type {
  GitBlameHunk,
  GitBranch,
  GitCheckoutInfo,
  GitCommitSummary,
  GitCommitDetail,
  GitWorkingTreeFile,
  GitWorkingTreeFileDiffContent,
} from 'share/types/git'
import {
  fileBelongsToDisplayGroup,
  resolveWorkingTreeSelection,
  type RefreshWorkingTreeOptions,
  type WorkingTreeDisplayGroup,
} from '../lib/workingTree'

export type GitViewMode = 'history' | 'workingTree'

const COMMITS_PAGE_SIZE = 50
const SEARCH_DEBOUNCE_MS = 300

class Repo {
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

  // View mode
  viewMode: GitViewMode = 'workingTree'

  // Working tree state
  checkoutInfo: GitCheckoutInfo | null = null
  workingTreeFiles: GitWorkingTreeFile[] = []
  selectedWorkingTreeFile: GitWorkingTreeFile | null = null
  workingTreeDiffContent: GitWorkingTreeFileDiffContent | null = null
  loadingWorkingTree = false
  loadingWorkingTreeDiff = false
  workingTreeMutating = false
  workingTreeRefreshing = false
  private workingTreeDiffLoadId = 0
  commitMessage = ''
  committing = false

  get hasStagedChanges(): boolean {
    return this.workingTreeFiles.some((file) => file.group === 'staged')
  }

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

  async setViewMode(mode: GitViewMode) {
    if (this.viewMode === mode) return

    this.viewMode = mode

    if (mode === 'history') {
      this.selectedWorkingTreeFile = null
      this.workingTreeDiffContent = null
      return
    }

    this.setBrowsingFiles(false)
    await this.refreshWorkingTree()
  }

  async refreshWorkingTree(options: RefreshWorkingTreeOptions = {}) {
    if (!this.repoPath) return

    const showLoading = options.showLoading ?? true
    if (!showLoading && this.workingTreeRefreshing) return

    if (showLoading) {
      this.loadingWorkingTree = true
    } else {
      this.workingTreeRefreshing = true
    }
    this.setError(null)

    try {
      await this.syncPreloadRepo()
      const result = await git.getWorkingTreeStatus()
      const selectionBeforeResolve = this.selectedWorkingTreeFile
      const nextSelected = resolveWorkingTreeSelection(
        result.files,
        selectionBeforeResolve,
        options
      )

      runInAction(() => {
        this.checkoutInfo = result.checkout
        this.workingTreeFiles = result.files
        this.selectedWorkingTreeFile = nextSelected
        if (!nextSelected) {
          this.workingTreeDiffContent = null
        }
      })

      if (nextSelected) {
        const reloadDiff =
          options.reloadDiff ||
          !selectionBeforeResolve ||
          selectionBeforeResolve.id !== nextSelected.id ||
          selectionBeforeResolve.group !== nextSelected.group

        if (reloadDiff) {
          await this.loadWorkingTreeDiff(nextSelected, {
            showLoading: showLoading && !this.workingTreeDiffContent,
          })
        }
      }
    } catch (err) {
      console.error('Failed to load working tree status:', err)
      runInAction(() => {
        this.setError(String(err))
        if (showLoading) {
          this.workingTreeFiles = []
          this.checkoutInfo = null
          this.selectedWorkingTreeFile = null
          this.workingTreeDiffContent = null
        }
      })
    } finally {
      runInAction(() => {
        if (showLoading) {
          this.loadingWorkingTree = false
        } else {
          this.workingTreeRefreshing = false
        }
      })
    }
  }

  async selectWorkingTreeFile(file: GitWorkingTreeFile) {
    const sameFile = this.selectedWorkingTreeFile?.id === file.id
    this.selectedWorkingTreeFile = file

    if (
      sameFile &&
      this.workingTreeDiffContent &&
      !this.loadingWorkingTreeDiff
    ) {
      return
    }

    await this.loadWorkingTreeDiff(file)
  }

  private async loadWorkingTreeDiff(
    file: GitWorkingTreeFile,
    options: { showLoading?: boolean } = {}
  ) {
    const showLoading = options.showLoading ?? true
    const loadId = ++this.workingTreeDiffLoadId

    if (showLoading) {
      this.loadingWorkingTreeDiff = true
    }
    this.setError(null)

    try {
      await this.syncPreloadRepo()
      const diff = await git.getWorkingTreeFileDiffContent(
        file.path,
        file.group,
        file.status,
        file.renameFrom
      )
      if (loadId !== this.workingTreeDiffLoadId) return

      runInAction(() => {
        this.workingTreeDiffContent = diff
      })
    } catch (err) {
      if (loadId !== this.workingTreeDiffLoadId) return

      console.error('Failed to load working tree diff:', err)
      runInAction(() => {
        this.setError(String(err))
        if (showLoading) {
          this.workingTreeDiffContent = null
        }
      })
    } finally {
      if (loadId === this.workingTreeDiffLoadId && showLoading) {
        runInAction(() => {
          this.loadingWorkingTreeDiff = false
        })
      }
    }
  }

  private async withWorkingTreeMutation<T>(fn: () => Promise<T>): Promise<T> {
    this.workingTreeMutating = true
    try {
      return await fn()
    } finally {
      this.workingTreeMutating = false
    }
  }

  async stageWorkingTreeFile(file: GitWorkingTreeFile) {
    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await git.stageFile(file.path)
        const wasSelected = this.selectedWorkingTreeFile?.path === file.path
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected
            ? { selectPath: file.path, selectGroup: 'staged' as const }
            : {}),
        })
      } catch (err) {
        console.error('Failed to stage file:', err)
        this.setError(String(err))
      }
    })
  }

  async unstageWorkingTreeFile(file: GitWorkingTreeFile) {
    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await git.unstageFile(file.path)
        const wasSelected = this.selectedWorkingTreeFile?.path === file.path
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected
            ? { selectPath: file.path, selectGroup: 'changes' as const }
            : {}),
        })
      } catch (err) {
        console.error('Failed to unstage file:', err)
        this.setError(String(err))
      }
    })
  }

  async discardWorkingTreeFile(file: GitWorkingTreeFile) {
    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await git.discardFile(file.path, file.group)
        const wasSelected = this.selectedWorkingTreeFile?.path === file.path
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected ? { selectPath: file.path } : {}),
        })
      } catch (err) {
        console.error('Failed to discard file:', err)
        this.setError(String(err))
      }
    })
  }

  private getWorkingTreeGroupPaths(group: WorkingTreeDisplayGroup): string[] {
    return this.workingTreeFiles
      .filter((file) => fileBelongsToDisplayGroup(file, group))
      .map((file) => file.path)
  }

  async stageWorkingTreeGroup(group: WorkingTreeDisplayGroup) {
    const paths = this.getWorkingTreeGroupPaths(group)
    if (paths.length === 0) return

    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await git.stageFiles(paths)
        await this.refreshWorkingTree({ showLoading: false })
      } catch (err) {
        console.error('Failed to stage group:', err)
        this.setError(String(err))
      }
    })
  }

  async unstageWorkingTreeGroup() {
    if (!this.hasStagedChanges) return

    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await git.unstageAllFiles()
        await this.refreshWorkingTree({ showLoading: false })
      } catch (err) {
        console.error('Failed to unstage group:', err)
        this.setError(String(err))
      }
    })
  }

  setCommitMessage(message: string) {
    this.commitMessage = message
  }

  async commitWorkingTree() {
    const message = this.commitMessage.trim()
    if (!message || !this.hasStagedChanges || this.committing) return

    return this.withWorkingTreeMutation(async () => {
      this.committing = true
      try {
        await this.syncPreloadRepo()
        await git.commitStaged(message)
        runInAction(() => {
          this.commitMessage = ''
        })
        await this.refreshWorkingTree({ showLoading: false })
        if (this.selectedBranch) {
          await this.loadCommits(this.selectedBranch.fullName)
        }
      } catch (err) {
        console.error('Failed to commit:', err)
        this.setError(String(err))
      } finally {
        runInAction(() => {
          this.committing = false
        })
      }
    })
  }

  async discardWorkingTreeGroup(group: WorkingTreeDisplayGroup) {
    const paths = this.getWorkingTreeGroupPaths(group)
    if (paths.length === 0) return

    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        if (group === 'changes') {
          const trackedPaths = this.workingTreeFiles
            .filter((file) => file.group === 'changes')
            .map((file) => file.path)
          const untrackedPaths = this.workingTreeFiles
            .filter((file) => file.group === 'untracked')
            .map((file) => file.path)
          if (trackedPaths.length > 0) {
            await git.discardFiles(trackedPaths, 'changes')
          }
          if (untrackedPaths.length > 0) {
            await git.discardFiles(untrackedPaths, 'untracked')
          }
        } else {
          await git.discardFiles(paths, group)
        }
        const wasSelected =
          this.selectedWorkingTreeFile != null &&
          fileBelongsToDisplayGroup(this.selectedWorkingTreeFile, group)
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected
            ? { selectPath: this.selectedWorkingTreeFile!.path }
            : {}),
        })
      } catch (err) {
        console.error('Failed to discard group:', err)
        this.setError(String(err))
      }
    })
  }
}

export default Repo
