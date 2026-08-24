import { makeAutoObservable, observable, reaction } from 'mobx'
import BaseStore, { storage } from 'share/store/Base'
import TextSearch from 'share/lib/textSearch'
import type { ITreeNode } from 'share/components/FileTree'
import type { IFileWatchEvent } from '../../common/types'
import normalizePath from 'licia/normalizePath'
import last from 'licia/last'
import { parentDir, relativePath } from '../lib/path'
import TerminalStore from 'share/store/Terminal'
import { initAiChatAvailability } from 'share/lib/aiChat/aiAvailability'
import { LocalStoreChatPrefs } from 'share/lib/aiChat/chatPrefsStorage'
import type AiChatStore from 'share/store/AiChat'
import Editor from './Editor'
import QuickOpen from './QuickOpen'
import WorkingTree from './WorkingTree'
import { createCodeEditorChat } from '../lib/chat'
import type { EditorChatContext } from '../lib/chatTools'
import {
  getProjectData,
  getSavedWindowBounds,
  saveWindowBounds,
  setProjectData,
} from '../lib/projectStorage'
import { createMcpApi } from '../mcp'

const chatPrefsStorage = new LocalStoreChatPrefs(storage)
// The main window only shows the welcome screen, every project is opened in its
// own window carrying the project root in the url.
const initialRootPath = new URLSearchParams(location.search).get('root') || ''
const initialProject = initialRootPath ? getProjectData(initialRootPath) : {}
const STORAGE_RECENT_DIRECTORIES = 'recentDirectories'
const DEFAULT_WINDOW_WIDTH = 800
const DEFAULT_WINDOW_HEIGHT = 600

type SidebarMode = 'explorer' | 'search' | 'git'

export class Store extends BaseStore {
  // MCP is registered on the welcome window only so project windows do not
  // compete for the same plugin tools.
  readonly mcp = initialRootPath ? null : createMcpApi(() => this)

  // FileTree state (inline, tightly coupled)
  rootPath: string = initialRootPath
  recentDirectories: string[] = storage.get(STORAGE_RECENT_DIRECTORIES) || []
  fileTree: ITreeNode[] = []
  watchedDirs = observable.set<string>()
  treeRefreshDirs = observable.set<string>()
  treeRefreshVersion = 0
  private unwatch?: () => void
  private refreshingTree = false

  // Sub-stores
  terminal: TerminalStore
  editor: Editor
  quickOpen: QuickOpen
  textSearch: TextSearch
  workingTree: WorkingTree
  chat: AiChatStore

  // sidebarOpen / chatOpen are per-project; mode always starts as explorer
  sidebarOpen: boolean = initialProject.sidebarOpen !== false
  sidebarMode: SidebarMode = 'explorer'
  hasAI = false
  chatOpen = false

  constructor() {
    super()

    this.terminal = new TerminalStore(() => this.rootPath)
    this.editor = new Editor()
    this.chat = createCodeEditorChat(
      chatPrefsStorage,
      () => this.rootPath,
      () => this.getEditorChatContext()
    )
    this.quickOpen = new QuickOpen({
      getRootPath: () => this.rootPath,
      getOpenTabPaths: () =>
        this.editor.tabs
          .filter((tab) => tab.category !== 'gitDiff' && tab.filePath)
          .map((tab) => tab.filePath),
      onOpenFile: (filePath, fileName) =>
        this.editor.openFile(filePath, fileName),
    })
    this.textSearch = new TextSearch({
      persist: true,
      initialRootDir: this.rootPath,
    })
    this.workingTree = new WorkingTree({
      getIsDark: () => this.isDark,
      onOpenGitDiff: (file, repoPath) =>
        this.editor.openGitDiff(file, repoPath),
      onWorkingTreeRefreshed: (files, repoPath) =>
        this.editor.refreshOpenGitDiffTabs(files, repoPath),
    })

    makeAutoObservable(this, {
      mcp: false,
      quickOpen: false,
      textSearch: false,
      workingTree: false,
    })
  }

  init() {
    if (this.rootPath) {
      this.loadDirectory(this.rootPath)
      // The persisted search root is shared by all windows, so it is forced
      // back to this window's project root.
      this.textSearch.setRootDir(this.rootPath)
      void this.workingTree.onProjectRootChanged(this.rootPath)
      this.terminal.initIfOpen()
      // Same as share/popupWindow: persist bounds on close for next open.
      window.addEventListener('beforeunload', () => {
        saveWindowBounds(this.rootPath)
      })
    }
    void initAiChatAvailability(storage).then(({ hasAI }) => {
      this.hasAI = hasAI
      if (!this.rootPath) return
      this.chatOpen = getProjectData(this.rootPath).chatOpen === true
    })

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
      this.openProject(result.filePaths[0])
    }
  }

  openRecentDirectory(path: string) {
    this.openProject(path)
  }

  // Projects always live in their own window, so the current window keeps its
  // root and a new window is opened for the picked directory.
  openProject(path: string) {
    this.addRecentDirectory(path)

    const root = normalizePath(path)
    const url = new URL(location.href)
    url.search = ''
    url.searchParams.set('root', root)

    const saved = getSavedWindowBounds(root)
    const features = [
      `width=${saved?.width ?? DEFAULT_WINDOW_WIDTH}`,
      `height=${saved?.height ?? DEFAULT_WINDOW_HEIGHT}`,
      'resizable=yes',
      saved ? `left=${saved.x}` : '',
      saved ? `top=${saved.y}` : '',
    ]
      .filter(Boolean)
      .join(',')

    // Use _blank so Chromium does not navigate an existing named window (which
    // reloads it). Duplicate URLs are focused in setWindowOpenHandler instead.
    window.open(url.href, '_blank', features)
  }

  addRecentDirectory(path: string) {
    this.recentDirectories = [
      path,
      ...this.recentDirectories.filter((p) => p !== path),
    ].slice(0, 5)
    storage.set(STORAGE_RECENT_DIRECTORIES, this.recentDirectories)
  }

  removeRecentDirectory(path: string) {
    this.recentDirectories = this.recentDirectories.filter((p) => p !== path)
    storage.set(STORAGE_RECENT_DIRECTORIES, this.recentDirectories)
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
  forceOpenBinaryAsText = (tabId: string) =>
    this.editor.forceOpenBinaryAsText(tabId)
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
  selectSearchMatch = (
    match: Parameters<Editor['selectSearchMatch']>[0]
  ): ReturnType<Editor['selectSearchMatch']> =>
    this.editor.selectSearchMatch(match)

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
  get showingMarkdownPreview() {
    return this.editor.showingMarkdownPreview
  }
  toggleMarkdownPreview = () => this.editor.toggleMarkdownPreview()
  setMarkdownScrollPercent = (tabId: string, percent: number) =>
    this.editor.setMarkdownScrollPercent(tabId, percent)

  // ---- Terminal ----

  get terminalOpen() {
    return this.terminal.terminalOpen
  }
  set terminalOpen(v) {
    this.terminal.terminalOpen = v
  }

  toggleTerminal = () => this.terminal.toggle()
  openInIntegratedTerminal = (path: string, isDir: boolean) =>
    this.terminal.openInDirectory(path, isDir)

  toggleChat() {
    if (!this.hasAI || !this.rootPath) return
    this.chatOpen = !this.chatOpen
    setProjectData(this.rootPath, { chatOpen: this.chatOpen })
  }

  getEditorChatContext(): EditorChatContext {
    return {
      rootPath: this.rootPath,
      cursorLine: this.cursorLine,
      cursorColumn: this.cursorColumn,
      tabs: this.editor.tabs.map((tab) => ({
        filePath: tab.filePath,
        title: tab.title,
        isActive: tab.id === this.activeTabId,
        isDirty: tab.isDirty,
        category: tab.category,
      })),
    }
  }

  // ---- Layout proxies ----

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    if (this.rootPath) {
      setProjectData(this.rootPath, { sidebarOpen: this.sidebarOpen })
    }
  }

  setSidebarMode(mode: SidebarMode) {
    this.sidebarMode = mode
    if (!this.sidebarOpen) {
      this.sidebarOpen = true
      if (this.rootPath) {
        setProjectData(this.rootPath, { sidebarOpen: true })
      }
    }
  }

  openQuickOpen = () => this.quickOpen.show()

  findInFolder = (dirPath: string) => {
    if (!this.rootPath) return
    const rel = relativePath(this.rootPath, dirPath)
    this.textSearch.setIncludes(rel && rel !== '.' ? `./${rel}` : '')
    this.setSidebarMode('search')
  }
}

export default new Store()
