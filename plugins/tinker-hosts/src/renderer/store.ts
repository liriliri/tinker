import { makeAutoObservable, toJS } from 'mobx'
import safeStorage from 'licia/safeStorage'
import { HostsConfig, ViewMode } from './types'

const STORAGE_KEY_CONFIGS = 'tinker-hosts-configs'
const STORAGE_KEY_ACTIVE_IDS = 'tinker-hosts-active-ids'

const storage = safeStorage('local')

class HostsStore {
  configs: HostsConfig[] = []
  activeIds: string[] = []
  systemHosts: string = ''
  selectedId: string | 'system' = 'system'
  viewMode: ViewMode = 'system'
  loading: boolean = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async loadConfig() {
    try {
      console.log('Loading config from localStorage...')
      const savedConfigs = storage.getItem(STORAGE_KEY_CONFIGS)
      const savedActiveIds = storage.getItem(STORAGE_KEY_ACTIVE_IDS)

      if (savedConfigs) {
        this.configs = JSON.parse(savedConfigs)
        console.log('Configs loaded from localStorage:', this.configs)
      }

      if (savedActiveIds) {
        this.activeIds = JSON.parse(savedActiveIds)
        console.log('Active IDs loaded from localStorage:', this.activeIds)
      }

      if (!savedConfigs && !savedActiveIds) {
        console.log('Created default config')
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      this.error = `加载配置失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`
    }
  }

  saveConfigs() {
    try {
      storage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(this.configs))
      console.log('Configs saved to localStorage')
    } catch (error) {
      console.error('Failed to save configs:', error)
      this.error = `保存配置失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`
    }
  }

  saveActiveIds() {
    try {
      storage.setItem(STORAGE_KEY_ACTIVE_IDS, JSON.stringify(this.activeIds))
      console.log('Active IDs saved to localStorage')
    } catch (error) {
      console.error('Failed to save active IDs:', error)
      this.error = `保存配置失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`
    }
  }

  async loadSystemHosts() {
    try {
      console.log('Loading system hosts...')
      const systemHosts = hosts.readSystemHosts()
      console.log('System hosts loaded, length:', systemHosts.length)
      this.systemHosts = systemHosts
    } catch (error) {
      console.error('Failed to load system hosts:', error)
      this.error = `读取系统 hosts 文件失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`
      this.systemHosts = `# 无法读取系统 hosts 文件\n# 错误: ${
        error instanceof Error ? error.message : '未知错误'
      }`
    }
  }

  setSelectedId(id: string | 'system') {
    this.selectedId = id
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    if (mode === 'system') {
      this.loadSystemHosts()
      this.selectedId = 'system'
    }
  }

  updateConfig(id: string, content: string) {
    const newConfigs = this.configs.map((c) =>
      c.id === id ? { ...c, content } : c
    )
    this.configs = newConfigs
    this.saveConfigs()
  }

  addConfig(name: string) {
    const newConfig: HostsConfig = {
      id: Date.now().toString(),
      name,
      content: '',
    }

    this.configs = [...this.configs, newConfig]
    this.saveConfigs()
  }

  deleteConfig(id: string) {
    this.configs = this.configs.filter((c) => c.id !== id)
    this.activeIds = this.activeIds.filter((aid) => aid !== id)

    this.saveConfigs()
    this.saveActiveIds()
  }

  toggleActive(id: string) {
    const isActive = this.activeIds.includes(id)
    this.activeIds = isActive
      ? this.activeIds.filter((aid) => aid !== id)
      : [...this.activeIds, id]

    this.saveActiveIds()

    // Auto-apply hosts when toggling
    this.applyHosts().catch((error) => {
      console.error('Failed to auto-apply hosts after toggle:', error)
    })
  }

  async applyHosts() {
    try {
      hosts.applyHosts(toJS(this.activeIds), toJS(this.configs))
      await this.loadSystemHosts()
    } catch (error) {
      console.error('Failed to apply hosts:', error)
      throw error
    }
  }
}

const store = new HostsStore()

export default store
