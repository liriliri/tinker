import { makeAutoObservable, reaction } from 'mobx'
import uuid from 'licia/uuid'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import TextSearch, { type TextSearchActiveMatch } from 'share/lib/TextSearch'
import { getTerminalSession } from 'share/components/Terminal'
import { byteRangeToColumns } from 'share/lib/textSearchHighlight'
import type { editor as MonacoEditor } from 'monaco-editor'
import type {
  ITreeNode,
  IEditorTab,
  ITerminalTab,
  ILayoutNode,
  SplitDirection,
} from '../common/types'
import last from 'licia/last'

const storage = new LocalStore('tinker-code-editor')
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const STORAGE_ROOT_PATH = 'rootPath'
const STORAGE_TERMINAL_OPEN = 'terminalOpen'
const STORAGE_SIDEBAR_MODE = 'sidebarMode'

export type SidebarMode = 'explorer' | 'search'

interface RevealTarget {
  lineNumber: number
  submatches?: tinker.SearchTextSubmatch[]
}

function collectPaneIds(node: ILayoutNode): string[] {
  if (node.type === 'leaf') return [node.paneId]
  return [...collectPaneIds(node.first), ...collectPaneIds(node.second)]
}

function splitNode(
  node: ILayoutNode,
  targetPaneId: string,
  direction: SplitDirection,
  newPaneId: string
): ILayoutNode {
  if (node.type === 'leaf') {
    if (node.paneId === targetPaneId) {
      return {
        type: 'split',
        direction,
        first: { type: 'leaf', paneId: targetPaneId },
        second: { type: 'leaf', paneId: newPaneId },
      }
    }
    return node
  }
  return {
    ...node,
    first: splitNode(node.first, targetPaneId, direction, newPaneId),
    second: splitNode(node.second, targetPaneId, direction, newPaneId),
  }
}

function removePane(
  node: ILayoutNode,
  targetPaneId: string
): ILayoutNode | null {
  if (node.type === 'leaf') {
    return node.paneId === targetPaneId ? null : node
  }
  const first = removePane(node.first, targetPaneId)
  const second = removePane(node.second, targetPaneId)
  if (!first) return second
  if (!second) return first
  return { ...node, first, second }
}

function dualColumnsLayout(paneIds: string[]): ILayoutNode {
  return {
    type: 'split',
    direction: 'horizontal',
    firstSize: '50%',
    key: uuid(),
    first: { type: 'leaf', paneId: paneIds[0] },
    second: { type: 'leaf', paneId: paneIds[1] },
  }
}

function tripleColumnsLayout(paneIds: string[]): ILayoutNode {
  return {
    type: 'split',
    direction: 'horizontal',
    firstSize: '33%',
    key: uuid(),
    first: { type: 'leaf', paneId: paneIds[0] },
    second: {
      type: 'split',
      direction: 'horizontal',
      key: uuid(),
      first: { type: 'leaf', paneId: paneIds[1] },
      second: { type: 'leaf', paneId: paneIds[2] },
    },
  }
}

function gridLayout(paneIds: string[]): ILayoutNode {
  return {
    type: 'split',
    direction: 'vertical',
    firstSize: '50%',
    key: uuid(),
    first: {
      type: 'split',
      direction: 'horizontal',
      firstSize: '50%',
      key: uuid(),
      first: { type: 'leaf', paneId: paneIds[0] },
      second: { type: 'leaf', paneId: paneIds[1] },
    },
    second: {
      type: 'split',
      direction: 'horizontal',
      firstSize: '50%',
      key: uuid(),
      first: { type: 'leaf', paneId: paneIds[2] },
      second: { type: 'leaf', paneId: paneIds[3] },
    },
  }
}

class Store extends BaseStore {
  rootPath: string = storage.get(STORAGE_ROOT_PATH) || ''
  fileTree: ITreeNode[] = []
  tabs: IEditorTab[] = []
  activeTabId = ''
  sidebarOpen: boolean = storage.get(STORAGE_SIDEBAR_OPEN) ?? true
  sidebarMode: SidebarMode =
    (storage.get(STORAGE_SIDEBAR_MODE) as SidebarMode) || 'explorer'
  terminalOpen: boolean = storage.get(STORAGE_TERMINAL_OPEN) ?? false
  terminalTabs: ITerminalTab[] = []
  activeTerminalTabId = ''
  activePaneId = ''
  paneTitles: Record<string, string> = {}
  pendingCwd: Record<string, string> = {}
  onDestroyPane?: (id: string) => void
  cursorLine = 1
  cursorColumn = 1
  textSearch = new TextSearch({
    storageNamespace: 'tinker-code-editor-search',
    initialRootDir: storage.get(STORAGE_ROOT_PATH) || '',
  })
  private terminalTabCounter = 0
  private editorInstances: Map<string, MonacoEditor.IStandaloneCodeEditor> =
    new Map()
  private pendingReveals: Map<string, RevealTarget> = new Map()

  constructor() {
    super()
    makeAutoObservable(this, {
      onDestroyPane: false,
      pendingCwd: false,
      textSearch: false,
    })
    if (this.rootPath) {
      this.loadDirectory(this.rootPath)
      this.textSearch.setRootDir(this.rootPath)
    }
    if (this.terminalOpen) {
      this.addTerminalTab()
    }
    // Keep search rootDir in sync with the project root.
    reaction(
      () => this.rootPath,
      (rootPath) => {
        this.textSearch.setRootDir(rootPath)
      }
    )
  }

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

  setCursor(line: number, column: number) {
    this.cursorLine = line
    this.cursorColumn = column
  }

  toggleTerminal() {
    this.terminalOpen = !this.terminalOpen
    storage.set(STORAGE_TERMINAL_OPEN, this.terminalOpen)
    if (this.terminalOpen && this.terminalTabs.length === 0) {
      this.addTerminalTab()
    }
  }

  addTerminalTab() {
    this.terminalTabCounter++
    const paneId = uuid()
    const tab: ITerminalTab = {
      id: uuid(),
      title: `Terminal ${this.terminalTabCounter}`,
      layout: { type: 'leaf', paneId },
    }
    this.terminalTabs.push(tab)
    this.activeTerminalTabId = tab.id
    this.activePaneId = paneId
  }

  closeTerminalTab(id: string) {
    if (this.terminalTabs.length <= 1) {
      const tab = this.terminalTabs.find((t) => t.id === id)
      if (tab) {
        const paneIds = collectPaneIds(tab.layout)
        paneIds.forEach((pid) => this.onDestroyPane?.(pid))
      }
      this.terminalTabs = []
      this.activeTerminalTabId = ''
      this.activePaneId = ''
      this.terminalOpen = false
      storage.set(STORAGE_TERMINAL_OPEN, false)
      return
    }

    const tab = this.terminalTabs.find((t) => t.id === id)
    if (!tab) return

    const paneIds = collectPaneIds(tab.layout)
    paneIds.forEach((pid) => this.onDestroyPane?.(pid))

    const index = this.terminalTabs.findIndex((t) => t.id === id)
    this.terminalTabs.splice(index, 1)

    if (this.activeTerminalTabId === id) {
      const newIndex = Math.min(index, this.terminalTabs.length - 1)
      this.activeTerminalTabId = this.terminalTabs[newIndex].id
      const newTab = this.terminalTabs[newIndex]
      const remaining = collectPaneIds(newTab.layout)
      this.activePaneId = remaining[0]
    }
  }

  setActiveTerminalTab(id: string) {
    this.activeTerminalTabId = id
    const tab = this.terminalTabs.find((t) => t.id === id)
    if (tab) {
      const paneIds = collectPaneIds(tab.layout)
      if (!paneIds.includes(this.activePaneId)) {
        this.activePaneId = paneIds[0]
      }
    }
  }

  setActivePane(paneId: string) {
    this.activePaneId = paneId
    const title = this.paneTitles[paneId]
    if (title) {
      const tab = this.terminalTabs.find(
        (t) => t.id === this.activeTerminalTabId
      )
      if (tab) {
        tab.title = title
      }
    }
  }

  setPaneTitle(paneId: string, title: string) {
    if (this.paneTitles[paneId] === title) return
    this.paneTitles[paneId] = title

    if (paneId === this.activePaneId) {
      const tab = this.terminalTabs.find(
        (t) => t.id === this.activeTerminalTabId
      )
      if (tab) {
        tab.title = title
      }
    }
  }

  async splitPane(paneId: string, direction: SplitDirection) {
    const tab = this.terminalTabs.find((t) => t.id === this.activeTerminalTabId)
    if (!tab) return

    const newPaneId = uuid()
    const cwd = (await getTerminalSession(paneId)?.getInfo())?.cwd ?? ''
    if (cwd) {
      this.pendingCwd[newPaneId] = cwd
    }
    tab.layout = splitNode(tab.layout, paneId, direction, newPaneId)
    this.activePaneId = newPaneId
  }

  closePane(paneId: string) {
    const tab = this.terminalTabs.find((t) => t.id === this.activeTerminalTabId)
    if (!tab) return

    const paneIds = collectPaneIds(tab.layout)
    if (paneIds.length <= 1) {
      this.closeTerminalTab(tab.id)
      return
    }

    this.onDestroyPane?.(paneId)
    const result = removePane(tab.layout, paneId)
    if (result) {
      tab.layout = result
    }

    if (this.activePaneId === paneId) {
      const remaining = collectPaneIds(tab.layout)
      this.activePaneId = remaining[0]
    }
  }

  async setDualColumns() {
    await this.applyLayout(2, dualColumnsLayout)
  }

  async setTripleColumns() {
    await this.applyLayout(3, tripleColumnsLayout)
  }

  async setGrid() {
    await this.applyLayout(4, gridLayout)
  }

  private async applyLayout(
    targetCount: number,
    buildLayout: (paneIds: string[]) => ILayoutNode
  ) {
    const tab = this.terminalTabs.find((t) => t.id === this.activeTerminalTabId)
    if (!tab) return

    const paneIds = collectPaneIds(tab.layout)

    // Destroy excess panes
    if (paneIds.length > targetCount) {
      const toRemove = paneIds.slice(targetCount)
      toRemove.forEach((pid) => this.onDestroyPane?.(pid))
      if (toRemove.includes(this.activePaneId)) {
        this.activePaneId = paneIds[0]
      }
    }

    // Create missing panes
    const newPaneIds: string[] = []
    if (paneIds.length < targetCount) {
      const cwd = (await getTerminalSession(paneIds[0])?.getInfo())?.cwd ?? ''
      for (let i = paneIds.length; i < targetCount; i++) {
        const newPaneId = uuid()
        if (cwd) {
          this.pendingCwd[newPaneId] = cwd
        }
        newPaneIds.push(newPaneId)
      }
    }

    const finalPanes = [...paneIds.slice(0, targetCount), ...newPaneIds]
    tab.layout = buildLayout(finalPanes)

    if (newPaneIds.length > 0) {
      this.activePaneId = newPaneIds[0]
    }
  }

  moveTerminalTab(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.terminalTabs.length ||
      toIndex >= this.terminalTabs.length
    ) {
      return
    }
    const [tab] = this.terminalTabs.splice(fromIndex, 1)
    this.terminalTabs.splice(toIndex, 0, tab)
  }

  async openFolder() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      this.rootPath = result.filePaths[0]
      storage.set(STORAGE_ROOT_PATH, this.rootPath)
      await this.loadDirectory(this.rootPath)
    }
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

  async openFile(filePath: string, fileName: string): Promise<string | null> {
    const existing = this.tabs.find((t) => t.filePath === filePath)
    if (existing) {
      this.activeTabId = existing.id
      return existing.id
    }

    try {
      const content = (await tinker.readFile(filePath, 'utf-8')) as string
      const tab: IEditorTab = {
        id: uuid(),
        title: fileName,
        filePath,
        content,
        isDirty: false,
      }
      this.tabs.push(tab)
      this.activeTabId = tab.id
      return tab.id
    } catch {
      return null
    }
  }

  selectSearchMatch = async (match: TextSearchActiveMatch) => {
    const fileName = last(match.path.split('/')) || match.path
    const tabId = await this.openFile(match.path, fileName)
    if (!tabId) return
    this.revealInTab(tabId, match.lineNumber, match.submatches)
  }

  registerEditor(tabId: string, instance: MonacoEditor.IStandaloneCodeEditor) {
    this.editorInstances.set(tabId, instance)
    const pending = this.pendingReveals.get(tabId)
    if (pending) {
      this.applyReveal(instance, pending)
      this.pendingReveals.delete(tabId)
    }
  }

  unregisterEditor(tabId: string) {
    this.editorInstances.delete(tabId)
    this.pendingReveals.delete(tabId)
  }

  private revealInTab(
    tabId: string,
    lineNumber: number,
    submatches?: tinker.SearchTextSubmatch[]
  ) {
    const target: RevealTarget = { lineNumber, submatches }
    const inst = this.editorInstances.get(tabId)
    if (inst) {
      this.applyReveal(inst, target)
    } else {
      // Editor not mounted yet (file just opened); apply on register.
      this.pendingReveals.set(tabId, target)
    }
  }

  private applyReveal(
    inst: MonacoEditor.IStandaloneCodeEditor,
    target: RevealTarget
  ) {
    const { lineNumber, submatches } = target
    inst.revealLineInCenter(lineNumber)
    if (submatches && submatches.length > 0) {
      const lineText = inst.getModel()?.getLineContent(lineNumber) || ''
      const sm = submatches[0]
      const { startColumn, endColumn } = byteRangeToColumns(
        lineText,
        sm.start,
        sm.end
      )
      inst.setSelection({
        startLineNumber: lineNumber,
        startColumn,
        endLineNumber: lineNumber,
        endColumn,
      })
    } else {
      inst.setPosition({ lineNumber, column: 1 })
    }
    inst.focus()
  }

  updateContent(tabId: string, content: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (tab) {
      tab.content = content
      tab.isDirty = true
    }
  }

  async saveFile(tabId?: string) {
    const id = tabId || this.activeTabId
    const tab = this.tabs.find((t) => t.id === id)
    if (!tab) return

    try {
      await tinker.writeFile(tab.filePath, tab.content, 'utf-8')
      tab.isDirty = false
    } catch {
      // ignore write errors
    }
  }

  closeTab(id: string) {
    const index = this.tabs.findIndex((t) => t.id === id)
    if (index === -1) return

    this.tabs.splice(index, 1)
    this.unregisterEditor(id)

    if (this.activeTabId === id) {
      if (this.tabs.length > 0) {
        const newIndex = Math.min(index, this.tabs.length - 1)
        this.activeTabId = this.tabs[newIndex].id
      } else {
        this.activeTabId = ''
      }
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
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
}

export default new Store()
