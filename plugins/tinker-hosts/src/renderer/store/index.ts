import { makeAutoObservable, toJS } from 'mobx'
import safeStorage from 'licia/safeStorage'
import { AppConfig, HostsConfig, ViewMode } from '../types'

const STORAGE_KEY = 'tinker-hosts-config'

const storage = safeStorage('local')

class HostsStore {
  config: AppConfig | null = null
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
      const savedConfig = storage.getItem(STORAGE_KEY)

      if (savedConfig) {
        this.config = JSON.parse(savedConfig)
        console.log('Config loaded from localStorage:', this.config)
      } else {
        const defaultConfig: AppConfig = {
          configs: [],
          activeIds: [],
        }
        this.config = defaultConfig
        this.saveConfig()
        console.log('Created default config')
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      this.error = `加载配置失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`
    }
  }

  async saveConfig() {
    if (!this.config) return
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(this.config))
      console.log('Config saved to localStorage')
    } catch (error) {
      console.error('Failed to save config:', error)
      this.error = `保存配置失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`
    }
  }

  async loadSystemHosts() {
    try {
      console.log('Loading system hosts...')
      const systemHosts = window.hosts.readSystemHosts()
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
    if (!this.config) return

    const newConfigs = this.config.configs.map((c) =>
      c.id === id ? { ...c, content } : c
    )
    this.config = { ...this.config, configs: newConfigs }
    this.saveConfig()
  }

  addConfig(name: string, group: 'common' | 'custom') {
    if (!this.config) return

    const newConfig: HostsConfig = {
      id: Date.now().toString(),
      name,
      content: '',
      group,
    }

    this.config = {
      ...this.config,
      configs: [...this.config.configs, newConfig],
    }
    this.saveConfig()
  }

  deleteConfig(id: string) {
    if (!this.config) return

    const newConfigs = this.config.configs.filter((c) => c.id !== id)
    const newActiveIds = this.config.activeIds.filter((aid) => aid !== id)

    this.config = {
      configs: newConfigs,
      activeIds: newActiveIds,
    }
    this.saveConfig()
  }

  toggleActive(id: string) {
    if (!this.config) return

    const isActive = this.config.activeIds.includes(id)
    const newActiveIds = isActive
      ? this.config.activeIds.filter((aid) => aid !== id)
      : [...this.config.activeIds, id]

    this.config = {
      ...this.config,
      activeIds: newActiveIds,
    }
    this.saveConfig()
  }

  async applyHosts() {
    if (!this.config) return

    try {
      window.hosts.applyHosts(
        toJS(this.config.activeIds),
        toJS(this.config.configs)
      )
      await this.loadSystemHosts()
    } catch (error) {
      console.error('Failed to apply hosts:', error)
      throw error
    }
  }
}

const store = new HostsStore()

export default store
