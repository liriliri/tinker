import { makeAutoObservable } from 'mobx'
import uuid from 'licia/uuid'
import LocalStore from 'licia/LocalStore'
import normalizePath from 'licia/normalizePath'
import { getTerminalSession } from '../components/Terminal'
import type { ILayoutNode, SplitDirection } from '../types/terminalLayout'
import TerminalTabStore from './TerminalTab'

const STORAGE_TERMINAL_OPEN = 'terminalOpen'

function parentDir(filePath: string): string {
  const normalized = normalizePath(filePath)
  const i = normalized.lastIndexOf('/')
  return i > 0 ? normalized.substring(0, i) : normalized
}

class TerminalStore {
  terminalOpen: boolean
  tabs: TerminalTabStore[] = []
  activeTabId = ''
  activePaneId = ''
  paneTitles: Record<string, string> = {}
  pendingCwd: Record<string, string> = {}
  onDestroyPane?: (id: string) => void
  private tabCounter = 0
  private storage: LocalStore

  private getRootPath: () => string

  constructor(storageKey: string, getRootPath: () => string) {
    this.storage = new LocalStore(storageKey)
    this.terminalOpen = this.storage.get(STORAGE_TERMINAL_OPEN) ?? false
    this.getRootPath = getRootPath
    makeAutoObservable(this, {
      onDestroyPane: false,
      pendingCwd: false,
    })
  }

  initIfOpen() {
    if (this.terminalOpen) {
      this.addTab()
    }
  }

  toggle() {
    this.terminalOpen = !this.terminalOpen
    this.storage.set(STORAGE_TERMINAL_OPEN, this.terminalOpen)
    if (this.terminalOpen && this.tabs.length === 0) {
      this.addTab()
    }
  }

  open() {
    this.terminalOpen = true
    this.storage.set(STORAGE_TERMINAL_OPEN, true)
  }

  addTab(cwd?: string) {
    this.tabCounter++
    const paneId = uuid()
    if (cwd) {
      this.pendingCwd[paneId] = cwd
    }
    const tab = new TerminalTabStore(
      uuid(),
      `Terminal ${this.tabCounter}`,
      paneId
    )
    this.tabs.push(tab)
    this.activeTabId = tab.id
    this.activePaneId = paneId
  }

  openInDirectory(path: string, isDirectory: boolean) {
    const cwd = isDirectory ? path : parentDir(path)
    this.open()
    this.addTab(cwd)
  }

  closeTab(id: string) {
    if (this.tabs.length <= 1) {
      const tab = this.tabs.find((t) => t.id === id)
      if (tab) {
        const paneIds = tab.collectPaneIds()
        paneIds.forEach((pid) => this.onDestroyPane?.(pid))
      }
      this.tabs = []
      this.activeTabId = ''
      this.activePaneId = ''
      this.terminalOpen = false
      this.storage.set(STORAGE_TERMINAL_OPEN, false)
      return
    }

    const tab = this.tabs.find((t) => t.id === id)
    if (!tab) return

    const paneIds = tab.collectPaneIds()
    paneIds.forEach((pid) => this.onDestroyPane?.(pid))

    const index = this.tabs.findIndex((t) => t.id === id)
    this.tabs.splice(index, 1)

    if (this.activeTabId === id) {
      const newIndex = Math.min(index, this.tabs.length - 1)
      this.activeTabId = this.tabs[newIndex].id
      const newTab = this.tabs[newIndex]
      const remaining = newTab.collectPaneIds()
      this.activePaneId = remaining[0]
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
    const tab = this.tabs.find((t) => t.id === id)
    if (tab) {
      const paneIds = tab.collectPaneIds()
      if (!paneIds.includes(this.activePaneId)) {
        this.activePaneId = paneIds[0]
      }
      this.syncActiveTabTitle(tab)
    }
  }

  private syncActiveTabTitle(tab: TerminalTabStore) {
    const title = this.paneTitles[this.activePaneId]
    if (title) {
      tab.title = title
    }
  }

  setActivePane(paneId: string) {
    this.activePaneId = paneId
    const title = this.paneTitles[paneId]
    if (title) {
      const tab = this.tabs.find((t) => t.id === this.activeTabId)
      if (tab) {
        tab.title = title
      }
    }
  }

  setPaneTitle(paneId: string, title: string) {
    if (this.paneTitles[paneId] === title) return
    this.paneTitles[paneId] = title

    const tab = this.tabs.find((t) => t.id === this.activeTabId)
    if (tab && tab.collectPaneIds().includes(paneId)) {
      const paneIds = tab.collectPaneIds()
      if (paneIds.length === 1 || paneId === this.activePaneId) {
        tab.title = title
      }
    }
  }

  async splitPane(paneId: string, direction: SplitDirection) {
    const tab = this.tabs.find((t) => t.id === this.activeTabId)
    if (!tab) return

    const newPaneId = uuid()
    const cwd = (await getTerminalSession(paneId)?.getInfo())?.cwd ?? ''
    if (cwd) {
      this.pendingCwd[newPaneId] = cwd
    }
    tab.splitPane(paneId, direction, newPaneId)
    this.activePaneId = newPaneId
  }

  closePane(paneId: string) {
    const tab = this.tabs.find((t) => t.id === this.activeTabId)
    if (!tab) return

    const paneIds = tab.collectPaneIds()
    if (paneIds.length <= 1) {
      this.closeTab(tab.id)
      return
    }

    this.onDestroyPane?.(paneId)
    tab.removePane(paneId)

    if (this.activePaneId === paneId) {
      const remaining = tab.collectPaneIds()
      this.activePaneId = remaining[0]
    }
  }

  async setDualColumns() {
    await this.applyLayout(2, TerminalTabStore.dualColumnsLayout)
  }

  async setTripleColumns() {
    await this.applyLayout(3, TerminalTabStore.tripleColumnsLayout)
  }

  async setGrid() {
    await this.applyLayout(4, TerminalTabStore.gridLayout)
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

  get rootPath(): string {
    return this.getRootPath()
  }

  private async applyLayout(
    targetCount: number,
    buildLayout: (paneIds: string[]) => ILayoutNode
  ) {
    const tab = this.tabs.find((t) => t.id === this.activeTabId)
    if (!tab) return

    const paneIds = tab.collectPaneIds()

    if (paneIds.length > targetCount) {
      const toRemove = paneIds.slice(targetCount)
      toRemove.forEach((pid) => this.onDestroyPane?.(pid))
      if (toRemove.includes(this.activePaneId)) {
        this.activePaneId = paneIds[0]
      }
    }

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
}

export default TerminalStore
