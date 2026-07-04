import { makeAutoObservable, toJS } from 'mobx'
import uuid from 'licia/uuid'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/store/Base'
import {
  getAllFolders,
  putFolder,
  deleteFolder as dbDeleteFolder,
  ISessionFolder,
  ISessionConfig,
} from '../lib/db'
import type { ILayoutNode, SplitDirection } from '../types'
import Terminal from './Terminal'
import { getTerminalSession } from 'share/components/Terminal'

const storage = new LocalStore('tinker-terminal')
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'

class Store extends BaseStore {
  tabs: Terminal[] = []
  activeTabId = ''
  activePaneId = ''
  paneTitles: Record<string, string> = {}
  pendingCwd: Record<string, string> = {}
  pendingShell: Record<string, string> = {}
  pendingSSHConfig: Record<string, ISessionConfig> = {}
  onDestroyPane: ((paneId: string) => void) | null = null
  sidebarOpen: boolean = storage.get(STORAGE_SIDEBAR_OPEN) ?? false
  sessions: ISessionFolder[] = []

  private tabCounter = 0

  constructor() {
    super()
    makeAutoObservable(this, {
      onDestroyPane: false,
      pendingCwd: false,
      pendingShell: false,
      pendingSSHConfig: false,
    })
    this.addTab()
    this.loadSessions()
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  addTab(afterTabId?: string) {
    this.tabCounter++
    const paneId = uuid()
    const id = uuid()
    const tab = new Terminal(id, `Terminal ${this.tabCounter}`, paneId)

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

    this.activeTabId = id
    this.activePaneId = paneId
  }

  closeTab(id: string) {
    if (this.tabs.length <= 1) {
      window.close()
      return
    }

    const tab = this.tabs.find((t) => t.id === id)
    if (!tab) return

    const paneIds = tab.collectPaneIds()
    paneIds.forEach((pid) => this.onDestroyPane?.(pid))

    const index = this.tabs.findIndex((t) => t.id === id)
    this.tabs.splice(index, 1)

    if (this.tabs.length === 0) {
      this.addTab()
      return
    }

    if (this.activeTabId === id) {
      const newIndex = Math.min(index, this.tabs.length - 1)
      this.activeTabId = this.tabs[newIndex].id
      const newTab = this.tabs[newIndex]
      const paneIds = newTab.collectPaneIds()
      this.activePaneId = paneIds[0]
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

    // Update tab title if this pane is the active pane
    if (paneId === this.activePaneId) {
      const tab = this.tabs.find((t) => t.id === this.activeTabId)
      if (tab) {
        tab.title = title
      }
    }
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
    await this.applyLayout(2, Terminal.dualColumnsLayout)
  }

  async setTripleColumns() {
    await this.applyLayout(3, Terminal.tripleColumnsLayout)
  }

  async setGrid() {
    await this.applyLayout(4, Terminal.gridLayout)
  }

  private async applyLayout(
    targetCount: number,
    buildLayout: (paneIds: string[]) => ILayoutNode
  ) {
    const tab = this.tabs.find((t) => t.id === this.activeTabId)
    if (!tab) return

    const paneIds = tab.collectPaneIds()

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

  // Session management
  async loadSessions() {
    this.sessions = await getAllFolders()
  }

  async createFolder(name: string) {
    const folder: ISessionFolder = {
      id: uuid(),
      name,
      order: this.sessions.length,
      children: [],
    }
    this.sessions.push(folder)
    await putFolder(toJS(folder))
  }

  async renameFolder(id: string, name: string) {
    const folder = this.sessions.find((f) => f.id === id)
    if (!folder) return
    folder.name = name
    await putFolder(toJS(folder))
  }

  async deleteFolder(id: string) {
    const index = this.sessions.findIndex((f) => f.id === id)
    if (index === -1) return
    this.sessions.splice(index, 1)
    await dbDeleteFolder(id)
  }

  async createSession(folderId: string, config: ISessionConfig) {
    const folder = this.sessions.find((f) => f.id === folderId)
    if (!folder) return
    folder.children.push(config)
    await putFolder(toJS(folder))
  }

  async renameSession(folderId: string, sessionId: string, name: string) {
    const folder = this.sessions.find((f) => f.id === folderId)
    if (!folder) return
    const session = folder.children.find((s) => s.id === sessionId)
    if (!session) return
    session.name = name
    await putFolder(toJS(folder))
  }

  async updateSession(
    folderId: string,
    sessionId: string,
    config: Omit<ISessionConfig, 'id'>
  ) {
    const folder = this.sessions.find((f) => f.id === folderId)
    if (!folder) return
    const index = folder.children.findIndex((s) => s.id === sessionId)
    if (index === -1) return
    folder.children[index] = { ...folder.children[index], ...config }
    await putFolder(toJS(folder))
  }

  async deleteSession(folderId: string, sessionId: string) {
    const folder = this.sessions.find((f) => f.id === folderId)
    if (!folder) return
    folder.children = folder.children.filter((s) => s.id !== sessionId)
    await putFolder(toJS(folder))
  }

  openSession(config: ISessionConfig) {
    this.tabCounter++
    const paneId = uuid()
    const id = uuid()
    const tab = new Terminal(id, config.name, paneId)

    if (config.type === 'ssh') {
      this.pendingSSHConfig[paneId] = config
    } else {
      if (config.cwd) {
        this.pendingCwd[paneId] = config.cwd
      }
      if (config.shell) {
        this.pendingShell[paneId] = config.shell
      }
    }

    this.tabs.push(tab)
    this.activeTabId = id
    this.activePaneId = paneId
  }
}

export default new Store()
