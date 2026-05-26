import { makeAutoObservable } from 'mobx'
import uuid from 'licia/uuid'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
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

class Store extends BaseStore {
  rootPath: string = storage.get(STORAGE_ROOT_PATH) || ''
  fileTree: ITreeNode[] = []
  tabs: IEditorTab[] = []
  activeTabId = ''
  sidebarOpen: boolean = storage.get(STORAGE_SIDEBAR_OPEN) ?? true
  terminalOpen: boolean = storage.get(STORAGE_TERMINAL_OPEN) ?? false
  terminalTabs: ITerminalTab[] = []
  activeTerminalTabId = ''
  activePaneId = ''
  paneTitles: Record<string, string> = {}
  pendingCwd: Record<string, string> = {}
  onDestroyPane?: (id: string) => void
  private terminalTabCounter = 0

  constructor() {
    super()
    makeAutoObservable(this, {
      onDestroyPane: false,
      pendingCwd: false,
    })
    if (this.rootPath) {
      this.loadDirectory(this.rootPath)
    }
    if (this.terminalOpen) {
      this.addTerminalTab()
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
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
    const tab = this.terminalTabs.find((t) => t.id === id)
    if (!tab) return

    const paneIds = collectPaneIds(tab.layout)
    paneIds.forEach((pid) => this.onDestroyPane?.(pid))

    const index = this.terminalTabs.findIndex((t) => t.id === id)
    this.terminalTabs.splice(index, 1)

    if (this.activeTerminalTabId === id) {
      if (this.terminalTabs.length > 0) {
        const newIndex = Math.min(index, this.terminalTabs.length - 1)
        this.activeTerminalTabId = this.terminalTabs[newIndex].id
        const newTab = this.terminalTabs[newIndex]
        const remaining = collectPaneIds(newTab.layout)
        this.activePaneId = remaining[0]
      } else {
        this.activeTerminalTabId = ''
        this.activePaneId = ''
      }
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
    const cwd = await codeEditor.getTerminalFullCwd(paneId)
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
    if (paneIds.length <= 1) return

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

  async openFile(filePath: string, fileName: string) {
    const existing = this.tabs.find((t) => t.filePath === filePath)
    if (existing) {
      this.activeTabId = existing.id
      return
    }

    try {
      const content = await codeEditor.readFile(filePath)
      const tab: IEditorTab = {
        id: uuid(),
        title: fileName,
        filePath,
        content,
        isDirty: false,
      }
      this.tabs.push(tab)
      this.activeTabId = tab.id
    } catch {
      // ignore read errors
    }
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
      await codeEditor.writeFile(tab.filePath, tab.content)
      tab.isDirty = false
    } catch {
      // ignore write errors
    }
  }

  closeTab(id: string) {
    const index = this.tabs.findIndex((t) => t.id === id)
    if (index === -1) return

    this.tabs.splice(index, 1)

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
