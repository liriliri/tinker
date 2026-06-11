import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import Repo, { type GitViewMode } from './Repo'
import { repoDirName } from '../lib/util'

class Store extends BaseStore {
  tabs: Repo[] = []
  activeTabId = ''

  private nextId = 1
  private workingTreeUnwatch: (() => void) | undefined

  constructor() {
    super()
    makeAutoObservable(this)
    this.addTab()
  }

  private getTab(id: string): Repo | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  get activeTab(): Repo | undefined {
    return this.getTab(this.activeTabId)
  }

  get repoPath() {
    return this.activeTab?.repoPath ?? ''
  }

  get branches() {
    return this.activeTab?.branches ?? []
  }

  get commits() {
    return this.activeTab?.commits ?? []
  }

  get selectedBranch() {
    return this.activeTab?.selectedBranch ?? null
  }

  get selectedCommit() {
    return this.activeTab?.selectedCommit ?? null
  }

  get commitDetail() {
    return this.activeTab?.commitDetail ?? null
  }

  get editorContent() {
    return this.activeTab?.editorContent ?? ''
  }

  get loading() {
    return this.activeTab?.loading ?? false
  }

  get loadingCommits() {
    return this.activeTab?.loadingCommits ?? false
  }

  get loadingMoreCommits() {
    return this.activeTab?.loadingMoreCommits ?? false
  }

  get hasMoreCommits() {
    return this.activeTab?.hasMoreCommits ?? false
  }

  get loadingDetail() {
    return this.activeTab?.loadingDetail ?? false
  }

  get error() {
    return this.activeTab?.error ?? null
  }

  get commitSearchQuery() {
    return this.activeTab?.commitSearchQuery ?? ''
  }

  get searching() {
    return this.activeTab?.searching ?? false
  }

  get commitAuthorFilter() {
    return this.activeTab?.commitAuthorFilter ?? ''
  }

  get authors() {
    return this.activeTab?.authors ?? []
  }

  get loadingAuthors() {
    return this.activeTab?.loadingAuthors ?? false
  }

  get loadingMoreSearch() {
    return this.activeTab?.loadingMoreSearch ?? false
  }

  get browsingFiles() {
    return this.activeTab?.browsingFiles ?? false
  }

  get treeNodes() {
    return this.activeTab?.treeNodes ?? []
  }

  get selectedFilePath() {
    return this.activeTab?.selectedFilePath ?? ''
  }

  get fileContent() {
    return this.activeTab?.fileContent ?? ''
  }

  get fileCategory() {
    return this.activeTab?.fileCategory ?? 'text'
  }

  get loadingFileContent() {
    return this.activeTab?.loadingFileContent ?? false
  }

  get showingBlame() {
    return this.activeTab?.showingBlame ?? false
  }

  get loadingBlame() {
    return this.activeTab?.loadingBlame ?? false
  }

  get blameLineAnnotations() {
    return this.activeTab?.blameLineAnnotations ?? []
  }

  get highlightedBlameSha() {
    return this.activeTab?.highlightedBlameSha ?? null
  }

  get viewMode(): GitViewMode {
    return this.activeTab?.viewMode ?? 'workingTree'
  }

  get checkoutInfo() {
    return this.activeTab?.checkoutInfo ?? null
  }

  get workingTreeFiles() {
    return this.activeTab?.workingTreeFiles ?? []
  }

  get selectedWorkingTreeFile() {
    return this.activeTab?.selectedWorkingTreeFile ?? null
  }

  get workingTreeDiffContent() {
    return this.activeTab?.workingTreeDiffContent ?? null
  }

  get loadingWorkingTree() {
    return this.activeTab?.loadingWorkingTree ?? false
  }

  get loadingWorkingTreeDiff() {
    return this.activeTab?.loadingWorkingTreeDiff ?? false
  }

  get commitMessage() {
    return this.activeTab?.commitMessage ?? ''
  }

  get hasStagedChanges() {
    return this.activeTab?.hasStagedChanges ?? false
  }

  get committing() {
    return this.activeTab?.committing ?? false
  }

  get workingTreeMutating() {
    return this.activeTab?.workingTreeMutating ?? false
  }

  setCommitMessage(message: string) {
    this.activeTab?.setCommitMessage(message)
  }

  commitWorkingTree() {
    return this.activeTab?.commitWorkingTree()
  }

  setHighlightedBlameSha(sha: string | null) {
    return this.activeTab?.setHighlightedBlameSha(sha)
  }

  updateTabTitle(tabId: string, title: string) {
    const tab = this.getTab(tabId)
    if (tab) tab.title = title
  }

  selectBranch(branch: Parameters<Repo['selectBranch']>[0]) {
    return this.activeTab?.selectBranch(branch)
  }

  selectCommit(commit: Parameters<Repo['selectCommit']>[0]) {
    return this.activeTab?.selectCommit(commit)
  }

  loadMoreCommits() {
    return this.activeTab?.loadMoreCommits()
  }

  setCommitSearchQuery(query: string) {
    this.activeTab?.setCommitSearchQuery(query)
  }

  setCommitAuthorFilter(author: string) {
    this.activeTab?.setCommitAuthorFilter(author)
  }

  ensureAuthorsLoaded() {
    return this.activeTab?.ensureAuthorsLoaded()
  }

  async setBrowsingFiles(on: boolean) {
    return this.activeTab?.setBrowsingFiles(on)
  }

  async openFile(filePath: string) {
    return this.activeTab?.openFile(filePath)
  }

  async toggleBlame() {
    return this.activeTab?.toggleBlame()
  }

  async setViewMode(mode: GitViewMode) {
    await this.activeTab?.setViewMode(mode)
    this.syncWorkingTreeWatcher()
  }

  private syncWorkingTreeWatcher() {
    this.workingTreeUnwatch?.()
    this.workingTreeUnwatch = undefined

    const tab = this.activeTab
    if (!tab || tab.viewMode !== 'workingTree' || !tab.repoPath) {
      return
    }

    const tabId = tab.id
    const repoPath = tab.repoPath

    this.workingTreeUnwatch = git.watchWorkingTree(repoPath, () => {
      const active = this.activeTab
      if (
        !active ||
        active.id !== tabId ||
        active.viewMode !== 'workingTree' ||
        active.repoPath !== repoPath
      ) {
        return
      }
      if (active.workingTreeMutating || active.workingTreeRefreshing) return

      void active.refreshWorkingTree({
        showLoading: false,
        reloadDiff: true,
      })
    })
  }

  refreshWorkingTree(options?: Parameters<Repo['refreshWorkingTree']>[0]) {
    return this.activeTab?.refreshWorkingTree(options)
  }

  selectWorkingTreeFile(file: Parameters<Repo['selectWorkingTreeFile']>[0]) {
    return this.activeTab?.selectWorkingTreeFile(file)
  }

  stageWorkingTreeFile(file: Parameters<Repo['stageWorkingTreeFile']>[0]) {
    return this.activeTab?.stageWorkingTreeFile(file)
  }

  unstageWorkingTreeFile(file: Parameters<Repo['unstageWorkingTreeFile']>[0]) {
    return this.activeTab?.unstageWorkingTreeFile(file)
  }

  discardWorkingTreeFile(file: Parameters<Repo['discardWorkingTreeFile']>[0]) {
    return this.activeTab?.discardWorkingTreeFile(file)
  }

  stageWorkingTreeGroup(group: Parameters<Repo['stageWorkingTreeGroup']>[0]) {
    return this.activeTab?.stageWorkingTreeGroup(group)
  }

  unstageWorkingTreeGroup() {
    return this.activeTab?.unstageWorkingTreeGroup()
  }

  discardWorkingTreeGroup(
    group: Parameters<Repo['discardWorkingTreeGroup']>[0]
  ) {
    return this.activeTab?.discardWorkingTreeGroup(group)
  }

  private updateWindowTitle() {
    const tab = this.activeTab
    tinker.setTitle(tab?.title || '')
  }

  addTab(afterTabId?: string) {
    const id = `tab-${this.nextId++}`
    const tab = new Repo(id)
    if (afterTabId) {
      const index = this.tabs.findIndex((t) => t.id === afterTabId)
      if (index !== -1) {
        this.tabs.splice(index + 1, 0, tab)
      } else {
        this.tabs.push(tab)
      }
    } else {
      this.tabs.push(tab)
    }
    this.setActiveTab(id)
  }

  closeTab(id: string) {
    if (this.tabs.length <= 1) {
      window.close()
      return
    }

    const index = this.tabs.findIndex((t) => t.id === id)
    if (index === -1) return

    this.tabs.splice(index, 1)

    if (this.activeTabId === id) {
      const newIndex = Math.min(index, this.tabs.length - 1)
      this.setActiveTab(this.tabs[newIndex].id)
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
    const tab = this.activeTab
    if (tab?.repoPath) {
      void tab.syncPreloadRepo()
    }
    this.updateWindowTitle()
    this.syncWorkingTreeWatcher()
  }

  moveTab(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tabs.length ||
      toIndex >= this.tabs.length
    ) {
      return
    }
    const [tab] = this.tabs.splice(fromIndex, 1)
    this.tabs.splice(toIndex, 0, tab)
  }

  async openRepositoryDialog() {
    try {
      const result = await tinker.showOpenDialog({
        properties: ['openDirectory'],
      })

      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return
      }

      await this.openRepository(result.filePaths[0])
    } catch (err) {
      console.error('Failed to open repository:', err)
      const tab = this.activeTab
      if (tab) tab.setError(String(err))
    }
  }

  async openRepository(path: string) {
    const tab = this.activeTab
    if (!tab) return

    runInAction(() => {
      tab.loading = true
      tab.setError(null)
    })

    try {
      await this.refreshBranches(tab, path)
      runInAction(() => {
        this.updateTabTitle(tab.id, repoDirName(path))
        this.updateWindowTitle()
      })
      this.syncWorkingTreeWatcher()
    } catch (err) {
      console.error('Failed to open repository:', err)
      runInAction(() => {
        tab.setError('NOT_A_GIT_REPO')
      })
    } finally {
      runInAction(() => {
        tab.loading = false
      })
    }
  }

  async refreshBranches(tab: Repo = this.activeTab!, repoPath?: string) {
    if (!repoPath && !tab?.repoPath) return

    tab.loading = true
    tab.setError(null)

    try {
      await tab.syncPreloadRepo(repoPath)
      const branches = await git.getBranches()
      tab.branches = branches

      const current =
        branches.find((branch) => branch.isHead && branch.kind === 'local') ||
        branches.find((branch) => branch.kind === 'local') ||
        null

      if (current) {
        await tab.selectBranch(current)
      } else {
        runInAction(() => {
          tab.selectedBranch = null
          tab.commits = []
          tab.selectedCommit = null
          tab.commitDetail = null
          tab.editorContent = ''
        })
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
      throw err
    } finally {
      tab.loading = false
    }
  }
}

export default new Store()
