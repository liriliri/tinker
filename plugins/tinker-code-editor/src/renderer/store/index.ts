import { makeAutoObservable, observable, reaction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import TextSearch from 'share/lib/textSearch'
import type { ITreeNode } from 'share/components/FileTree'
import type { IFileWatchEvent } from '../../common/types'
import normalizePath from 'licia/normalizePath'
import last from 'licia/last'
import { parentDir } from '../lib/path'
import Terminal from 'share/store/Terminal'
import type { SplitDirection } from 'share/types/terminalLayout'
import Editor from './Editor'
import WorkingTree from './WorkingTree'

const storage = new LocalStore('tinker-code-editor')
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const STORAGE_ROOT_PATH = 'rootPath'
const STORAGE_SIDEBAR_MODE = 'sidebarMode'
const STORAGE_RECENT_DIRECTORIES = 'recentDirectories'

export type SidebarMode = 'explorer' | 'search' | 'git'

class Store extends BaseStore {
  // FileTree state (inline, tightly coupled)
  rootPath: string = storage.get(STORAGE_ROOT_PATH) || ''
  recentDirectories: string[] = storage.get(STORAGE_RECENT_DIRECTORIES) || []
  fileTree: ITreeNode[] = []
  watchedDirs = observable.set<string>()
  treeRefreshDirs = observable.set<string>()
  treeRefreshVersion = 0
  private unwatch?: () => void
  private refreshingTree = false

  // Sub-stores
  terminal: Terminal
  editor: Editor
  textSearch: TextSearch
  workingTree: WorkingTree

  // Layout state
  sidebarOpen: boolean = storage.get(STORAGE_SIDEBAR_OPEN) ?? true
  sidebarMode: SidebarMode =
    (storage.get(STORAGE_SIDEBAR_MODE) as SidebarMode) || 'explorer'

  constructor() {
    super()

    this.terminal = new Terminal('tinker-code-editor', () => this.rootPath)
    this.editor = new Editor()
    this.textSearch = new TextSearch({
      storageNamespace: 'tinker-code-editor-search',
      initialRootDir: storage.get(STORAGE_ROOT_PATH) || '',
    })
    this.workingTree = new WorkingTree({
      getIsDark: () => this.isDark,
      onOpenGitDiff: (file, repoPath) =>
        this.editor.openGitDiff(file, repoPath),
      onWorkingTreeRefreshed: (files, repoPath) =>
        this.editor.refreshOpenGitDiffTabs(files, repoPath),
    })

    makeAutoObservable(this, {
      textSearch: false,
      workingTree: false,
    })

    if (this.rootPath) {
      this.loadDirectory(this.rootPath)
      this.textSearch.setRootDir(this.rootPath)
      void this.workingTree.onProjectRootChanged(this.rootPath)
    }
    this.terminal.initIfOpen()

    // Keep search rootDir in sync with the project root
    reaction(
      () => this.rootPath,
      (rootPath) => {
        this.textSearch.setRootDir(rootPath)
        void this.workingTree.onProjectRootChanged(rootPath)
      }
    )
    reaction(
      () => this.sidebarMode,
      (mode) => {
        if (mode === 'git' && this.workingTree.isGitRepo) {
          void this.workingTree.refreshWorkingTree()
        }
      }
    )
    reaction(
      () => this.getWatchPaths().join('\0'),
      () => this.syncFileWatcher()
    )
  }

  // ---- FileTree methods ----

  async openFolder() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const path = result.filePaths[0]
      await this.setRootPath(path)
    }
  }

  async openRecentDirectory(path: string) {
    try {
      await this.setRootPath(path)
    } catch {
      this.removeRecentDirectory(path)
    }
  }

  closeProject() {
    if (!this.rootPath) return

    this.rootPath = ''
    storage.set(STORAGE_ROOT_PATH, '')
    this.fileTree = []
    this.unwatch?.()
    this.unwatch = undefined
    this.watchedDirs.clear()
    this.treeRefreshDirs.clear()

    for (const tab of [...this.editor.tabs]) {
      this.editor.closeTab(tab.id)
    }
    for (const tab of [...this.terminal.tabs]) {
      this.terminal.closeTab(tab.id)
    }
    this.workingTree.dispose()
    this.workingTree.reset()
  }

  addRecentDirectory(path: string) {
    this.recentDirectories = [
      path,
      ...this.recentDirectories.filter((p) => p !== path),
    ].slice(0, 10)
    storage.set(STORAGE_RECENT_DIRECTORIES, this.recentDirectories)
  }

  removeRecentDirectory(path: string) {
    this.recentDirectories = this.recentDirectories.filter((p) => p !== path)
    storage.set(STORAGE_RECENT_DIRECTORIES, this.recentDirectories)
  }

  private async setRootPath(path: string) {
    this.rootPath = path
    storage.set(STORAGE_ROOT_PATH, path)
    this.addRecentDirectory(path)
    this.watchedDirs.clear()
    this.treeRefreshDirs.clear()
    await this.loadDirectory(path)
  }

  async loadDirectory(dirPath: string) {
    try {
      const entries = await codeEditor.readDir(dirPath)
      this.fileTree = entries.map((e) => ({
        name: e.name,
        path: e.path,
        isDirectory: e.isDirectory,
      }))
      const dirName = last(dirPath.split('/'))
      tinker.setTitle(dirName || '')
    } catch {
      this.fileTree = []
    }
  }

  setDirExpanded(dirPath: string, expanded: boolean) {
    const dir = normalizePath(dirPath)
    if (expanded) {
      this.watchedDirs.add(dir)
    } else {
      this.watchedDirs.delete(dir)
    }
  }

  consumeTreeRefresh(dirPath: string) {
    this.treeRefreshDirs.delete(normalizePath(dirPath))
  }

  markTreeDirDirty(dirPath: string) {
    const dir = normalizePath(dirPath)
    if (!this.treeRefreshDirs.has(dir)) {
      this.treeRefreshDirs.add(dir)
    }
    this.treeRefreshVersion++
  }

  private getWatchPaths(): string[] {
    const paths = new Set<string>()
    if (this.rootPath) paths.add(normalizePath(this.rootPath))
    this.watchedDirs.forEach((dir) => paths.add(dir))
    for (const tab of this.editor.tabs) paths.add(normalizePath(tab.filePath))
    return [...paths]
  }

  private syncFileWatcher() {
    this.unwatch?.()
    this.unwatch = undefined

    const paths = this.getWatchPaths()
    if (paths.length === 0) return

    this.unwatch = codeEditor.watchPaths(paths, (events) => {
      this.handleWatchEvents(events)
    })
  }

  private handleWatchEvents(events: IFileWatchEvent[]) {
    let refreshRoot = false
    const dirsToRefresh = new Set<string>()
    const filesToReload = new Set<string>()
    const root = this.rootPath ? normalizePath(this.rootPath) : ''

    for (const event of events) {
      const filePath = normalizePath(event.path)

      if (event.type === 'change') {
        if (!this.shouldIgnoreFileChange(filePath)) {
          filesToReload.add(filePath)
        }
        continue
      }

      const parent = parentDir(filePath)
      if (parent === root) {
        refreshRoot = true
      } else if (this.watchedDirs.has(parent)) {
        dirsToRefresh.add(parent)
      }
    }

    if (refreshRoot) {
      void this.refreshRootTree()
    }
    dirsToRefresh.forEach((dir) => this.markTreeDirDirty(dir))
    filesToReload.forEach(
      (filePath) => void this.editor.reloadOpenFile(filePath)
    )
  }

  private shouldIgnoreFileChange(filePath: string): boolean {
    const normalized = normalizePath(filePath)
    const savedAt = this.editor.recentlySavedPaths.get(normalized)
    if (!savedAt) return false
    if (Date.now() - savedAt < 500) return true
    this.editor.recentlySavedPaths.delete(normalized)
    return false
  }

  private async refreshRootTree() {
    if (!this.rootPath || this.refreshingTree) return
    this.refreshingTree = true
    try {
      await this.loadDirectory(this.rootPath)
    } finally {
      this.refreshingTree = false
    }
  }

  // ---- Editor proxies ----

  get tabs() {
    return this.editor.tabs
  }
  get activeTabId() {
    return this.editor.activeTabId
  }
  set activeTabId(v) {
    this.editor.activeTabId = v
  }
  get cursorLine() {
    return this.editor.cursorLine
  }
  get cursorColumn() {
    return this.editor.cursorColumn
  }
  get tabDirtyRevision() {
    return this.editor.tabDirtyRevision
  }

  openFile = (filePath: string, fileName: string) =>
    this.editor.openFile(filePath, fileName)
  updateContent = (tabId: string, content: string) =>
    this.editor.updateContent(tabId, content)
  saveFile = (tabId?: string) => this.editor.saveFile(tabId)
  closeTab = (id: string) => this.editor.closeTab(id)
  setActiveTab = (id: string) => this.editor.setActiveTab(id)
  moveTab = (fromIndex: number, toIndex: number) =>
    this.editor.moveTab(fromIndex, toIndex)
  setCursor = (line: number, column: number) =>
    this.editor.setCursor(line, column)
  registerEditor = (
    tabId: string,
    inst: Parameters<Editor['registerEditor']>[1]
  ) => this.editor.registerEditor(tabId, inst)
  unregisterEditor = (tabId: string) => this.editor.unregisterEditor(tabId)
  selectSearchMatch(
    match: Parameters<Editor['selectSearchMatch']>[0]
  ): ReturnType<Editor['selectSearchMatch']> {
    return this.editor.selectSearchMatch(match)
  }

  get showingBlame() {
    return this.editor.showingBlame
  }
  get loadingBlame() {
    return this.editor.loadingBlame
  }
  get blameLineAnnotations() {
    return this.editor.blameLineAnnotations
  }
  get highlightedBlameSha() {
    return this.editor.highlightedBlameSha
  }
  toggleBlame = () => this.editor.toggleBlame()
  setHighlightedBlameSha = (sha: string | null) =>
    this.editor.setHighlightedBlameSha(sha)

  // ---- Terminal proxies ----

  get terminalOpen() {
    return this.terminal.terminalOpen
  }
  set terminalOpen(v) {
    this.terminal.terminalOpen = v
  }
  get terminalTabs() {
    return this.terminal.tabs
  }
  get activeTerminalTabId() {
    return this.terminal.activeTabId
  }
  get activePaneId() {
    return this.terminal.activePaneId
  }
  set activePaneId(v) {
    this.terminal.activePaneId = v
  }
  get paneTitles() {
    return this.terminal.paneTitles
  }
  get pendingCwd() {
    return this.terminal.pendingCwd
  }
  get onDestroyPane() {
    return this.terminal.onDestroyPane
  }
  set onDestroyPane(v) {
    this.terminal.onDestroyPane = v
  }

  toggleTerminal = () => this.terminal.toggle()
  addTerminalTab = (cwd?: string) => this.terminal.addTab(cwd)
  openInIntegratedTerminal = (path: string, isDir: boolean) =>
    this.terminal.openInDirectory(path, isDir)
  closeTerminalTab = (id: string) => this.terminal.closeTab(id)
  setActiveTerminalTab = (id: string) => this.terminal.setActiveTab(id)
  setActivePane = (paneId: string) => this.terminal.setActivePane(paneId)
  setPaneTitle = (paneId: string, title: string) =>
    this.terminal.setPaneTitle(paneId, title)
  splitPane = (paneId: string, direction: SplitDirection) =>
    this.terminal.splitPane(paneId, direction)
  closePane = (paneId: string) => this.terminal.closePane(paneId)
  setDualColumns = () => this.terminal.setDualColumns()
  setTripleColumns = () => this.terminal.setTripleColumns()
  setGrid = () => this.terminal.setGrid()
  moveTerminalTab = (from: number, to: number) =>
    this.terminal.moveTab(from, to)

  // ---- Layout proxies ----

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setSidebarMode(mode: SidebarMode) {
    this.sidebarMode = mode
    storage.set(STORAGE_SIDEBAR_MODE, mode)
    if (!this.sidebarOpen) {
      this.sidebarOpen = true
      storage.set(STORAGE_SIDEBAR_OPEN, true)
    }
  }

  toggleSidebarMode() {
    this.setSidebarMode(this.sidebarMode === 'explorer' ? 'search' : 'explorer')
  }
}

export default new Store()
