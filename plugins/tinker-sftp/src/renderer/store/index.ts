import { makeAutoObservable, runInAction, toJS } from 'mobx'
import uuid from 'licia/uuid'
import isEmpty from 'licia/isEmpty'
import LocalStore from 'licia/LocalStore'
import toast from 'react-hot-toast'
import i18next from 'i18next'
import BaseStore from 'share/store/Base'
import {
  getAllFolders,
  putFolder,
  deleteFolder as dbDeleteFolder,
  type ISessionFolder,
} from '../lib/db'
import type { ISftpSessionConfig, ViewMode } from '../../common/types'
import { SFTP_TRANSFER_PROGRESS_CHANNEL } from '../../common/types'
import Explorer from './Explorer'
import Transfer from './Transfer'
import { isHiddenEntry } from '../lib/util'

const storage = new LocalStore('tinker-sftp')
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const STORAGE_SHOW_HIDDEN = 'showHiddenFiles'
const STORAGE_VIEW_MODE = 'viewMode'
const STORAGE_TRANSFER_PANEL = 'transferPanelOpen'

class Store extends BaseStore {
  sidebarOpen: boolean = storage.get(STORAGE_SIDEBAR_OPEN) ?? true
  sessions: ISessionFolder[] = []
  showHiddenFiles: boolean = storage.get(STORAGE_SHOW_HIDDEN) === true
  viewMode: ViewMode = storage.get(STORAGE_VIEW_MODE) ?? 'list'
  transferPanelOpen: boolean = storage.get(STORAGE_TRANSFER_PANEL) === true

  tabs: Explorer[] = []
  activeTabId = ''
  transfers: Transfer[] = []

  constructor() {
    super()
    makeAutoObservable(this)
    window.addEventListener('message', this.onTransferProgressMessage)
    void this.init()
  }

  private onTransferProgressMessage = (event: MessageEvent) => {
    if (event.source !== window || !event.data) return
    if (event.data.channel !== SFTP_TRANSFER_PROGRESS_CHANNEL) return

    const { transferId, transferred, total } = event.data as {
      transferId: string
      transferred: number
      total: number
    }

    runInAction(() => {
      this.updateTransferProgress(transferId, transferred, total)
    })
  }

  isTabTransferring(tabId: string): boolean {
    return this.transfers.some((item) => item.tabId === tabId && item.isActive)
  }

  get activeTab(): Explorer | undefined {
    return this.tabs.find((tab) => tab.id === this.activeTabId)
  }

  isSessionConnected(sessionId: string): boolean {
    return this.tabs.some(
      (tab) => tab.session.id === sessionId && tab.connected
    )
  }

  private async init() {
    await this.loadSessions()
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setShowHiddenFiles(value: boolean) {
    this.showHiddenFiles = value
    storage.set(STORAGE_SHOW_HIDDEN, value)

    for (const tab of this.tabs) {
      tab.showHiddenFiles = value
      if (!value) {
        tab.selectedPaths = tab.selectedPaths.filter(
          (entryPath) => !isHiddenEntry(sftp.basename(entryPath))
        )
      }
    }
  }

  toggleShowHiddenFiles() {
    this.setShowHiddenFiles(!this.showHiddenFiles)
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    storage.set(STORAGE_VIEW_MODE, mode)
  }

  toggleTransferPanel() {
    this.setTransferPanelOpen(!this.transferPanelOpen)
  }

  setTransferPanelOpen(value: boolean) {
    this.transferPanelOpen = value
    storage.set(STORAGE_TRANSFER_PANEL, value)
  }

  clearCompletedTransfers() {
    this.transfers = this.transfers.filter((item) => item.isActive)
  }

  private updateTransferProgress(
    transferId: string,
    transferred: number,
    total: number
  ) {
    const transfer = this.transfers.find((item) => item.id === transferId)
    if (!transfer) return
    transfer.transferred = transferred
    if (total > 0) {
      transfer.total = total
    }
  }

  private addTransfer(
    tabId: string,
    type: Transfer['type'],
    fileName: string,
    sourcePath: string,
    destPath: string
  ) {
    const transfer = new Transfer(
      uuid(),
      tabId,
      type,
      fileName,
      sourcePath,
      destPath
    )
    this.transfers.unshift(transfer)
    this.setTransferPanelOpen(true)
    return transfer
  }

  async loadSessions() {
    this.sessions = await getAllFolders()
  }

  async createSessionFolder(name: string) {
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
    const folder = this.sessions.find((item) => item.id === id)
    if (!folder) return
    folder.name = name
    await putFolder(toJS(folder))
  }

  async deleteFolder(id: string) {
    const index = this.sessions.findIndex((item) => item.id === id)
    if (index === -1) return
    this.sessions.splice(index, 1)
    await dbDeleteFolder(id)
  }

  async createSession(folderId: string, config: ISftpSessionConfig) {
    const folder = this.sessions.find((item) => item.id === folderId)
    if (!folder) return
    folder.children.push(config)
    await putFolder(toJS(folder))
  }

  async updateSession(
    folderId: string,
    sessionId: string,
    config: Omit<ISftpSessionConfig, 'id'>
  ) {
    const folder = this.sessions.find((item) => item.id === folderId)
    if (!folder) return
    const index = folder.children.findIndex((item) => item.id === sessionId)
    if (index === -1) return
    folder.children[index] = { ...folder.children[index], ...config }
    await putFolder(toJS(folder))

    for (const tab of this.tabs) {
      if (tab.session.id === sessionId) {
        tab.session = folder.children[index]
      }
    }
  }

  async deleteSession(folderId: string, sessionId: string) {
    const folder = this.sessions.find((item) => item.id === folderId)
    if (!folder) return

    const tabsToClose = this.tabs.filter((tab) => tab.session.id === sessionId)
    for (const tab of tabsToClose) {
      await this.closeTab(tab.id)
    }

    folder.children = folder.children.filter((item) => item.id !== sessionId)
    await putFolder(toJS(folder))
  }

  openSession(config: ISftpSessionConfig) {
    const tab = new Explorer(uuid(), config)
    tab.showHiddenFiles = this.showHiddenFiles
    this.tabs.push(tab)
    this.activeTabId = tab.id
    void this.connectTab(tab.id)
  }

  async connectTab(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab || tab.connecting || tab.connected) return

    tab.connecting = true
    tab.connectionError = ''

    try {
      await sftp.connect(tab.id, {
        host: tab.session.host,
        port: tab.session.port,
        username: tab.session.username,
        authType: tab.session.authType,
        password: tab.session.password,
        privateKey: tab.session.privateKey,
      })

      const remotePath = await sftp.resolveRemotePath(tab.id, '.')

      runInAction(() => {
        tab.connected = true
        tab.path = remotePath
        tab.history = [remotePath]
        tab.historyIndex = 0
        tab.pathInput = remotePath
        tab.clearSelection()
        tab.clearFilter()
      })

      await this.loadTabDir(tabId, remotePath, false)
    } catch (err) {
      runInAction(() => {
        tab.connected = false
        tab.connectionError = (err as Error).message
      })
    } finally {
      runInAction(() => {
        tab.connecting = false
      })
    }
  }

  async closeTab(id: string) {
    const index = this.tabs.findIndex((tab) => tab.id === id)
    if (index === -1) return

    const tab = this.tabs[index]
    if (tab.connected || sftp.isConnected(id)) {
      await sftp.disconnect(id)
    }

    this.tabs.splice(index, 1)
    if (this.activeTabId === id) {
      const next = this.tabs[index] ?? this.tabs[index - 1]
      this.activeTabId = next?.id ?? ''
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
  }

  moveTab(fromIndex: number, toIndex: number) {
    if (
      fromIndex < 0 ||
      fromIndex >= this.tabs.length ||
      toIndex < 0 ||
      toIndex >= this.tabs.length
    ) {
      return
    }
    const [tab] = this.tabs.splice(fromIndex, 1)
    this.tabs.splice(toIndex, 0, tab)
  }

  async disconnectTab(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab || !tab.connected) return

    await sftp.disconnect(tabId)
    tab.connected = false
    tab.connectionError = ''
    tab.entries = []
    tab.path = '.'
    tab.history = ['.']
    tab.historyIndex = 0
    tab.pathInput = '.'
    tab.clearSelection()
  }

  setPathInput(tabId: string, value: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (tab) {
      tab.pathInput = value
    }
  }

  async navigateTab(tabId: string, nextPath: string, pushHistory = true) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab || !tab.connected) return

    if (pushHistory) {
      tab.pushHistory(nextPath)
    }
    tab.path = nextPath
    tab.clearSelection()
    tab.clearFilter()
    tab.pathInput = nextPath
    await this.loadTabDir(tabId, nextPath, false)
  }

  async loadTabDir(tabId: string, dirPath: string, fromHistory: boolean) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab || !tab.connected) return

    tab.loading = true
    tab.error = null

    try {
      const entries = await sftp.readRemoteDir(tabId, dirPath)

      runInAction(() => {
        tab.entries = entries
        tab.loading = false
        tab.path = dirPath
        if (fromHistory) {
          tab.pathInput = dirPath
        }
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      runInAction(() => {
        tab.loading = false
        tab.error = message
      })
    }
  }

  async refreshTab(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab) return
    await this.loadTabDir(tabId, tab.path, false)
  }

  async goBack(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab) return
    const nextPath = tab.goBack()
    if (nextPath) {
      await this.loadTabDir(tabId, nextPath, true)
    }
  }

  async goForward(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab) return
    const nextPath = tab.goForward()
    if (nextPath) {
      await this.loadTabDir(tabId, nextPath, true)
    }
  }

  async goUp(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab || !tab.canGoUp) return
    await this.navigateTab(tabId, sftp.dirnameRemote(tab.path))
  }

  async submitPathInput(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab) return
    const path = tab.pathInput.trim()
    if (!path) return
    await this.navigateTab(tabId, path)
  }

  async activateEntry(tabId: string, entryPath: string, isDirectory: boolean) {
    if (isDirectory) {
      await this.navigateTab(tabId, entryPath)
      return
    }

    await this.promptDownloadFiles(tabId, [entryPath])
  }

  async promptDownloadSelected(tabId: string): Promise<number> {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab?.connected || isEmpty(tab.selectedPaths)) return 0
    return this.promptDownloadFiles(tabId, tab.selectedPaths)
  }

  async promptDownloadFiles(
    tabId: string,
    entryPaths: string[]
  ): Promise<number> {
    if (isEmpty(entryPaths)) return 0

    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return 0

    const names = await this.downloadFiles(
      tabId,
      result.filePaths[0],
      entryPaths
    )
    if (names.length > 0) {
      toast.success(i18next.t('downloadSuccess', { name: names.join(', ') }))
    }
    return names.length
  }

  async createDirectory(tabId: string, name: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab || !tab.connected) return

    const target = sftp.joinRemotePath(tab.path, name)
    await sftp.mkdirRemote(tabId, target)
    await this.refreshTab(tabId)
  }

  async renameEntry(tabId: string, oldPath: string, newName: string) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab || !tab.connected) return

    const trimmed = newName.trim()
    if (!trimmed || trimmed.includes('/') || trimmed.includes('\\')) return

    const newPath = sftp.joinRemotePath(sftp.dirnameRemote(oldPath), trimmed)
    if (newPath === oldPath) return

    await sftp.renameRemote(tabId, oldPath, newPath)
    tab.selectedPaths = tab.selectedPaths.map((entryPath) =>
      entryPath === oldPath ? newPath : entryPath
    )
    await this.refreshTab(tabId)
  }

  async deleteEntries(tabId: string, paths: string[]) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (isEmpty(paths) || !tab || !tab.connected) return

    for (const entryPath of paths) {
      await sftp.deleteRemote(tabId, entryPath)
    }

    tab.selectedPaths = tab.selectedPaths.filter(
      (entryPath) => !paths.includes(entryPath)
    )
    await this.refreshTab(tabId)
  }

  async uploadFiles(tabId: string, localPaths: string[]): Promise<string[]> {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab?.connected || isEmpty(localPaths)) {
      return []
    }

    const names: string[] = []

    for (const localPath of localPaths) {
      const name = sftp.basename(localPath)
      const remoteTarget = sftp.joinRemotePath(tab.path, name)
      const transfer = this.addTransfer(
        tabId,
        'upload',
        name,
        localPath,
        remoteTarget
      )
      transfer.status = 'running'

      try {
        await sftp.upload(tabId, localPath, remoteTarget, transfer.id)
        transfer.status = 'completed'
        transfer.transferred = transfer.total || transfer.transferred
        names.push(name)
      } catch (err) {
        transfer.status = 'failed'
        transfer.error = (err as Error).message
      }
    }

    if (names.length > 0) {
      await this.refreshTab(tabId)
    }
    return names
  }

  async downloadFiles(
    tabId: string,
    destDir: string,
    entryPaths: string[]
  ): Promise<string[]> {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab?.connected || isEmpty(entryPaths)) return []

    const names: string[] = []

    for (const entryPath of entryPaths) {
      const entry = tab.entries.find((item) => item.path === entryPath)
      if (!entry) continue

      const localTarget = sftp.joinPath(destDir, entry.name)
      const transfer = this.addTransfer(
        tabId,
        'download',
        entry.name,
        entryPath,
        localTarget
      )
      transfer.status = 'running'

      try {
        await sftp.download(tabId, entryPath, localTarget, transfer.id)
        transfer.status = 'completed'
        transfer.transferred = transfer.total || transfer.transferred
        names.push(entry.name)
      } catch (err) {
        transfer.status = 'failed'
        transfer.error = (err as Error).message
      }
    }

    return names
  }
}

export default new Store()
