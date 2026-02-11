import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'
import { confirm } from 'share/components/Confirm'
import LocalStore from 'licia/LocalStore'
import i18n from './i18n'

const STORAGE_KEY_VIEW_MODE = 'view-mode'

const storage = new LocalStore('tinker-process-killer')

interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  mem: number
  memRss: number
  user: string
  command?: string
  path?: string
  state?: string
  ports?: string
}

type SortField = 'pid' | 'name' | 'cpu' | 'memRss'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'cpu' | 'memory' | 'port'

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

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
    this.init()
  }

  private async init() {
    await this.refreshProcessList()
    this.startAutoRefresh()
  }

  async refreshProcessList() {
    this.isLoading = true
    try {
      const [processes, networkConnections] = await Promise.all([
        processKiller.getProcessList(),
        processKiller.getNetworkConnections(),
      ])

      const portsByPid = new Map<number, Set<string>>()
      networkConnections.forEach((conn: any) => {
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
      alert({ title: i18n.t('refreshFailed') })
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
    } else {
      this.sortField = 'name'
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
      alert({ title: i18n.t('killSuccess') })
      await this.refreshProcessList()
    } catch (error) {
      console.error('Failed to kill process:', error)
      alert({ title: i18n.t('killFailed') })
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
      let aVal: any = a[this.sortField]
      let bVal: any = b[this.sortField]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (this.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
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

  destroy() {
    this.stopAutoRefresh()
  }
}

const store = new Store()

export default store
