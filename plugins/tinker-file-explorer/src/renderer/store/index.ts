import { makeAutoObservable, runInAction } from 'mobx'
import uuid from 'licia/uuid'
import LocalStore from 'licia/LocalStore'
import pluck from 'licia/pluck'
import BaseStore from 'share/BaseStore'
import type { IFavoritePlace, ViewMode } from '../../common/types'
import Explorer from './Explorer'

const storage = new LocalStore('tinker-file-explorer')
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const STORAGE_VIEW_MODE = 'viewMode'
const DRIVE_REFRESH_INTERVAL = 5000

const SHORTCUT_KEYS = [
  { key: 'home', labelKey: 'placeHome' },
  { key: 'desktop', labelKey: 'placeDesktop' },
  { key: 'documents', labelKey: 'placeDocuments' },
  { key: 'downloads', labelKey: 'placeDownloads' },
  { key: 'pictures', labelKey: 'placePictures' },
  { key: 'music', labelKey: 'placeMusic' },
  { key: 'videos', labelKey: 'placeVideos' },
] as const

class Store extends BaseStore {
  tabs: Explorer[] = []
  activeTabId = ''
  sidebarOpen: boolean = storage.get(STORAGE_SIDEBAR_OPEN) ?? true
  viewMode: ViewMode = storage.get(STORAGE_VIEW_MODE) ?? 'list'
  places: IFavoritePlace[] = []
  placesLoading = false
  pathInput = ''
  private driveRefreshTimer?: ReturnType<typeof setInterval>
  private lastDrivePaths = ''

  constructor() {
    super()
    makeAutoObservable(this)
    void this.init()
  }

  get activeTab(): Explorer | undefined {
    return this.tabs.find((tab) => tab.id === this.activeTabId)
  }

  private async init() {
    await this.loadPlaces()
    this.startDriveRefresh()
    const home = fileExplorer.getHomedir()
    this.addTab(home)
  }

  private startDriveRefresh() {
    this.driveRefreshTimer = setInterval(() => {
      void this.refreshDrives()
    }, DRIVE_REFRESH_INTERVAL)
  }

  private async refreshDrives() {
    try {
      const drives = await fileExplorer.getVolumes()
      const drivePaths = pluck(drives, 'path').join('\0')
      if (drivePaths === this.lastDrivePaths) return

      this.lastDrivePaths = drivePaths
      const shortcuts = this.places.filter(
        (place) => place.group === 'shortcuts'
      )
      const drivePlaces: IFavoritePlace[] = drives.map((drive) => ({
        id: `drive-${drive.path}`,
        label: drive.label,
        path: drive.path,
        group: 'drives',
      }))

      runInAction(() => {
        this.places = [...shortcuts, ...drivePlaces]
      })
    } catch {
      // ignore refresh errors
    }
  }

  async loadPlaces() {
    this.placesLoading = true
    const places: IFavoritePlace[] = []

    for (const item of SHORTCUT_KEYS) {
      try {
        const path = await tinker.getPath(item.key)
        places.push({
          id: `shortcut-${item.key}`,
          label: item.labelKey,
          path,
          group: 'shortcuts',
        })
      } catch {
        // skip unavailable path
      }
    }

    try {
      const drives = await fileExplorer.getVolumes()
      this.lastDrivePaths = drives.map((drive) => drive.path).join('\0')
      for (const drive of drives) {
        places.push({
          id: `drive-${drive.path}`,
          label: drive.label,
          path: drive.path,
          group: 'drives',
        })
      }
    } catch {
      // skip drives
    }

    runInAction(() => {
      this.places = places
      this.placesLoading = false
    })
  }

  addTab(path: string, activate = true) {
    const title = fileExplorer.basename(path) || path
    const tab = new Explorer(uuid(), path, title)
    tab.pushHistory(path)
    this.tabs.push(tab)
    if (activate) {
      this.activeTabId = tab.id
    }
    void this.loadTabDir(tab.id, path, false)
    return tab.id
  }

  closeTab(id: string) {
    const index = this.tabs.findIndex((tab) => tab.id === id)
    if (index < 0) return

    this.tabs.splice(index, 1)
    if (this.activeTabId === id) {
      const next = this.tabs[index] ?? this.tabs[index - 1]
      this.activeTabId = next?.id ?? ''
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
    const tab = this.tabs.find((t) => t.id === id)
    if (tab) {
      this.pathInput = tab.path
    }
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

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    storage.set(STORAGE_VIEW_MODE, mode)
  }

  openPath(path: string, newTab = false) {
    if (newTab || !this.activeTab) {
      this.addTab(path)
      return
    }
    void this.navigateTab(this.activeTab.id, path)
  }

  async navigateTab(tabId: string, path: string, pushHistory = true) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return

    if (pushHistory) {
      tab.pushHistory(path)
    }
    tab.path = path
    tab.title = fileExplorer.basename(path) || path
    tab.clearSelection()
    this.pathInput = path
    await this.loadTabDir(tabId, path, false)
  }

  async loadTabDir(tabId: string, path: string, fromHistory: boolean) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return

    tab.loading = true
    tab.error = null

    try {
      const entries = await fileExplorer.readDir(path)
      runInAction(() => {
        tab.entries = entries
        tab.loading = false
        tab.path = path
        tab.title = fileExplorer.basename(path) || path
        if (fromHistory) {
          this.pathInput = path
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
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return
    await this.loadTabDir(tabId, tab.path, false)
  }

  async goBack(tabId: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return
    const path = tab.goBack()
    if (path) {
      await this.loadTabDir(tabId, path, true)
    }
  }

  async goForward(tabId: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return
    const path = tab.goForward()
    if (path) {
      await this.loadTabDir(tabId, path, true)
    }
  }

  async goUp(tabId: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab || !tab.canGoUp) return
    const parent = fileExplorer.dirname(tab.path)
    await this.navigateTab(tabId, parent)
  }

  setPathInput(value: string) {
    this.pathInput = value
  }

  async submitPathInput(tabId: string) {
    const path = this.pathInput.trim()
    if (!path) return
    await this.navigateTab(tabId, path)
  }

  async createFolder(tabId: string, name: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return

    const dirPath = fileExplorer.joinPath(tab.path, name)
    await fileExplorer.createDir(dirPath)
    await this.refreshTab(tabId)
  }

  async activateEntry(tabId: string, entryPath: string, isDirectory: boolean) {
    if (isDirectory) {
      await this.navigateTab(tabId, entryPath)
      return
    }
    await fileExplorer.openPath(entryPath)
  }

  async trashPaths(tabId: string, paths: string[]) {
    if (paths.length === 0) return

    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return

    await fileExplorer.trashPaths(paths)

    runInAction(() => {
      tab.selectedPaths = tab.selectedPaths.filter(
        (path) => !paths.includes(path)
      )
    })

    await this.refreshTab(tabId)
  }

  async renameEntry(tabId: string, oldPath: string, newName: string) {
    const name = newName.trim()
    if (!name || name.includes('/') || name.includes('\\')) return

    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab) return

    const newPath = fileExplorer.joinPath(fileExplorer.dirname(oldPath), name)
    if (newPath === oldPath) return

    await fileExplorer.renamePath(oldPath, newPath)

    runInAction(() => {
      tab.selectedPaths = tab.selectedPaths.map((path) =>
        path === oldPath ? newPath : path
      )
    })

    await this.refreshTab(tabId)
  }
}

export default new Store()
