import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import { confirm } from 'share/components/Confirm'
import LocalStore from 'licia/LocalStore'
import i18n from './i18n'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import defaultIcon from './assets/default-icon.png'
import defaultWinIcon from './assets/default-win-icon.png'
import toast from 'react-hot-toast'
import type { ProcessInfo, NetworkConnection } from '../common/types'
import type { SortField, SortOrder, ViewMode } from './types'

const STORAGE_KEY_VIEW_MODE = 'view-mode'

const storage = new LocalStore('tinker-process-killer')
const defaultAppIcon = isWindows ? defaultWinIcon : defaultIcon

class Store extends BaseStore {
  processes: ProcessInfo[] = []
  searchKeyword: string = ''
  sortField: SortField = 'cpu'
  sortOrder: SortOrder = 'desc'
  viewMode: ViewMode = 'cpu'
  isLoading: boolean = false
  autoRefresh: boolean = true
  refreshInterval: number = 5000

  private refreshTimer: NodeJS.Timeout | null = null
  private iconCache: Map<string, string> = new Map()
  private loadingIcons: Set<string> = new Set()

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
    this.init()
  }

  private async init() {
    await this.refreshProcessList(false)
    this.startAutoRefresh()
  }

  async refreshProcessList(showLoading: boolean = true) {
    this.isLoading = showLoading
    try {
      const [processes, networkConnections] = await Promise.all([
        processKiller.getProcessList(),
        processKiller.getNetworkConnections(),
      ])

      const portsByPid = new Map<number, Set<string>>()
      networkConnections.forEach((conn: NetworkConnection) => {
        if (conn.pid && conn.localPort) {
          if (!portsByPid.has(conn.pid)) {
            portsByPid.set(conn.pid, new Set())
          }
          const protocol = conn.protocol || 'tcp'
          portsByPid.get(conn.pid)!.add(`${protocol}:${conn.localPort}`)
        }
      })

      this.processes = processes.map((proc) => ({
        ...proc,
        ports: portsByPid.has(proc.pid)
          ? Array.from(portsByPid.get(proc.pid)!).join(', ')
          : undefined,
      }))
    } catch (error) {
      console.error('Failed to refresh process list:', error)
      toast.error(i18n.t('refreshFailed'))
    } finally {
      this.isLoading = false
    }
  }

  setSearchKeyword(keyword: string) {
    this.searchKeyword = keyword
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    if (mode === 'cpu') {
      this.sortField = 'cpu'
    } else if (mode === 'memory') {
      this.sortField = 'memRss'
    } else if (mode === 'port') {
      this.sortField = 'ports'
    }
    this.sortOrder = 'desc'
    this.saveViewMode()
  }

  setSortField(field: SortField) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortOrder = 'desc'
    }
  }

  async killProcess(pid: number, name: string) {
    const confirmed = await confirm({
      title: i18n.t('confirmKill'),
      message: i18n.t('confirmKillMessage', { name, pid }),
    })

    if (!confirmed) return

    try {
      await processKiller.killProcess(pid)
      toast.success(i18n.t('killSuccess'))
      await this.refreshProcessList()
    } catch (error) {
      console.error('Failed to kill process:', error)
      toast.error(i18n.t('killFailed'))
    }
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh
    if (this.autoRefresh) {
      this.startAutoRefresh()
    } else {
      this.stopAutoRefresh()
    }
  }

  private startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    this.refreshTimer = setInterval(() => {
      if (this.autoRefresh) {
        this.refreshProcessList()
      }
    }, this.refreshInterval)
  }

  private stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  get filteredProcesses() {
    let filtered = this.processes

    if (this.viewMode === 'port') {
      filtered = filtered.filter((proc) => proc.ports)
    }

    if (this.searchKeyword) {
      const keyword = this.searchKeyword.toLowerCase()
      filtered = filtered.filter(
        (proc) =>
          proc.name.toLowerCase().includes(keyword) ||
          proc.pid.toString().includes(keyword) ||
          proc.user?.toLowerCase().includes(keyword) ||
          proc.ports?.toLowerCase().includes(keyword)
      )
    }

    return filtered.slice().sort((a, b) => {
      let aVal: string | number | undefined = a[this.sortField]
      let bVal: string | number | undefined = b[this.sortField]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (this.sortOrder === 'asc') {
        if (aVal === undefined) return 1
        if (bVal === undefined) return -1
        return aVal > bVal ? 1 : -1
      } else {
        if (aVal === undefined) return 1
        if (bVal === undefined) return -1
        return aVal < bVal ? 1 : -1
      }
    })
  }

  private loadFromStorage() {
    try {
      const viewMode = storage.get(STORAGE_KEY_VIEW_MODE)
      if (viewMode) {
        this.viewMode = viewMode as ViewMode
      }
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  }

  private saveViewMode() {
    try {
      storage.set(STORAGE_KEY_VIEW_MODE, this.viewMode)
    } catch (error) {
      console.error('Failed to save view mode:', error)
    }
  }

  async loadProcessIcon(pid: number) {
    const process = this.processes.find((p) => p.pid === pid)
    if (!process) {
      return
    }

    if (!process.icon) {
      process.icon = defaultAppIcon
    }

    let filePath: string = process.path || ''

    if (!filePath) {
      return
    }

    if (isMac) {
      const appIndex = filePath.indexOf('.app/Contents/')
      if (appIndex !== -1) {
        filePath = filePath.substring(0, appIndex + 4)
      }
    }

    const cacheKey = filePath
    if (this.iconCache.has(cacheKey)) {
      process.icon = this.iconCache.get(cacheKey)
      return
    }

    if (this.loadingIcons.has(cacheKey)) {
      return
    }

    this.loadingIcons.add(cacheKey)
    try {
      let icon = await tinker.getFileIcon(filePath)
      if (!icon) {
        icon = defaultAppIcon
      }
      this.iconCache.set(cacheKey, icon)

      const currentProcess = this.processes.find((p) => p.pid === pid)
      if (currentProcess) {
        currentProcess.icon = icon
      }
    } catch {
      this.iconCache.set(cacheKey, defaultAppIcon)
    } finally {
      this.loadingIcons.delete(cacheKey)
    }
  }

  destroy() {
    this.stopAutoRefresh()
    this.iconCache.clear()
    this.loadingIcons.clear()
  }
}

const store = new Store()

export default store
