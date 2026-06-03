import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { GitBranch, GitCommitSummary, IRepoTab } from '../common/types'
import { formatCommitContent } from './lib/formatCommit'
import { repoDirName } from './lib/util'

function createEmptyTab(id: string): IRepoTab {
  return {
    id,
    title: '',
    repoPath: '',
    branches: [],
    commits: [],
    selectedBranch: null,
    selectedCommit: null,
    commitDetail: null,
    editorContent: '',
    loading: false,
    loadingCommits: false,
    loadingDetail: false,
    error: null,
  }
}

class Store extends BaseStore {
  tabs: IRepoTab[] = []
  activeTabId = ''

  private nextId = 1

  constructor() {
    super()
    makeAutoObservable(this)
    this.addTab()
  }

  private getTab(id: string): IRepoTab | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  get activeTab(): IRepoTab | undefined {
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

  get loadingDetail() {
    return this.activeTab?.loadingDetail ?? false
  }

  get error() {
    return this.activeTab?.error ?? null
  }

  private setTabError(tab: IRepoTab, message: string | null) {
    tab.error = message
  }

  updateTabTitle(tabId: string, title: string) {
    const tab = this.getTab(tabId)
    if (tab) tab.title = title
  }

  private updateWindowTitle() {
    const tab = this.activeTab
    tinker.setTitle(tab?.title || '')
  }

  private async syncPreloadRepo(tab: IRepoTab) {
    if (!tab.repoPath) return
    if (git.getRepoPath() === tab.repoPath) return
    await git.openRepository(tab.repoPath)
  }

  addTab(afterTabId?: string) {
    const id = `tab-${this.nextId++}`
    const tab = createEmptyTab(id)
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
      void this.syncPreloadRepo(tab)
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
      if (tab) this.setTabError(tab, String(err))
    }
  }

  async openRepository(path: string) {
    const tab = this.activeTab
    if (!tab) return

    runInAction(() => {
      tab.loading = true
      this.setTabError(tab, null)
      tab.repoPath = path
      this.updateTabTitle(tab.id, repoDirName(path))
      this.updateWindowTitle()
    })

    try {
      await this.refreshBranches(tab)
    } catch (err) {
      console.error('Failed to open repository:', err)
      runInAction(() => {
        this.setTabError(tab, String(err))
        tab.repoPath = ''
        tab.branches = []
        tab.commits = []
        tab.selectedBranch = null
        tab.selectedCommit = null
        tab.commitDetail = null
        tab.editorContent = ''
        this.updateTabTitle(tab.id, '')
        this.updateWindowTitle()
      })
    } finally {
      runInAction(() => {
        tab.loading = false
      })
    }
  }

  async refreshBranches(tab: IRepoTab = this.activeTab!) {
    if (!tab?.repoPath) return

    tab.loading = true
    this.setTabError(tab, null)

    try {
      await this.syncPreloadRepo(tab)
      const branches = await git.getBranches()
      tab.branches = branches

      const current =
        branches.find((branch) => branch.isHead && branch.kind === 'local') ||
        branches.find((branch) => branch.kind === 'local') ||
        null

      if (current) {
        await this.selectBranch(current, tab)
      } else {
        tab.selectedBranch = null
        tab.commits = []
        tab.selectedCommit = null
        tab.commitDetail = null
        tab.editorContent = ''
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
      this.setTabError(tab, String(err))
    } finally {
      tab.loading = false
    }
  }

  async selectBranch(branch: GitBranch, tab: IRepoTab = this.activeTab!) {
    if (!tab) return

    tab.selectedBranch = branch
    tab.selectedCommit = null
    tab.commitDetail = null
    tab.editorContent = ''
    await this.loadCommits(branch.fullName, tab)
  }

  async loadCommits(refName: string, tab: IRepoTab = this.activeTab!) {
    if (!tab) return

    tab.loadingCommits = true
    this.setTabError(tab, null)

    try {
      await this.syncPreloadRepo(tab)
      tab.commits = await git.getCommits(refName)
    } catch (err) {
      console.error('Failed to load commits:', err)
      this.setTabError(tab, String(err))
      tab.commits = []
    } finally {
      tab.loadingCommits = false
    }
  }

  async selectCommit(
    commit: GitCommitSummary,
    tab: IRepoTab = this.activeTab!
  ) {
    if (!tab) return

    tab.selectedCommit = commit
    tab.loadingDetail = true
    this.setTabError(tab, null)

    try {
      await this.syncPreloadRepo(tab)
      const detail = await git.getCommitDetail(commit.sha)
      tab.commitDetail = detail
      tab.editorContent = formatCommitContent(detail)
    } catch (err) {
      console.error('Failed to load commit detail:', err)
      this.setTabError(tab, String(err))
      tab.commitDetail = null
      tab.editorContent = ''
    } finally {
      tab.loadingDetail = false
    }
  }
}

export default new Store()
