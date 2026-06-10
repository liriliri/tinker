import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import RepoTab from './RepoTab'
import { repoDirName } from '../lib/util'

class Store extends BaseStore {
  tabs: RepoTab[] = []
  activeTabId = ''

  private nextId = 1

  constructor() {
    super()
    makeAutoObservable(this)
    this.addTab()
  }

  private getTab(id: string): RepoTab | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  get activeTab(): RepoTab | undefined {
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

  setHighlightedBlameSha(sha: string | null) {
    return this.activeTab?.setHighlightedBlameSha(sha)
  }

  updateTabTitle(tabId: string, title: string) {
    const tab = this.getTab(tabId)
    if (tab) tab.title = title
  }

  selectBranch(branch: Parameters<RepoTab['selectBranch']>[0]) {
    return this.activeTab?.selectBranch(branch)
  }

  selectCommit(commit: Parameters<RepoTab['selectCommit']>[0]) {
    return this.activeTab?.selectCommit(commit)
  }

  loadMoreCommits() {
    return this.activeTab?.loadMoreCommits()
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

  private updateWindowTitle() {
    const tab = this.activeTab
    tinker.setTitle(tab?.title || '')
  }

  addTab(afterTabId?: string) {
    const id = `tab-${this.nextId++}`
    const tab = new RepoTab(id)
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

  async refreshBranches(tab: RepoTab = this.activeTab!, repoPath?: string) {
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
