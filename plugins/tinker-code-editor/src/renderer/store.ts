import { makeAutoObservable } from 'mobx'
import uuid from 'licia/uuid'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import type { ITreeNode, IEditorTab } from '../common/types'
import last from 'licia/last'

const storage = new LocalStore('tinker-code-editor')
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const STORAGE_ROOT_PATH = 'rootPath'

class Store extends BaseStore {
  rootPath: string = storage.get(STORAGE_ROOT_PATH) || ''
  fileTree: ITreeNode[] = []
  tabs: IEditorTab[] = []
  activeTabId = ''
  sidebarOpen: boolean = storage.get(STORAGE_SIDEBAR_OPEN) ?? true

  constructor() {
    super()
    makeAutoObservable(this)
    if (this.rootPath) {
      this.loadDirectory(this.rootPath)
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
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
