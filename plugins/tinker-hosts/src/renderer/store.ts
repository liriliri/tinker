import { makeAutoObservable, toJS } from 'mobx'
import safeStorage from 'licia/safeStorage'
import uuid from 'licia/uuid'
import contain from 'licia/contain'
import remove from 'licia/remove'
import { HostsConfig, ViewMode } from './types'

const STORAGE_KEY_CONFIGS = 'tinker-hosts-configs'
const STORAGE_KEY_ACTIVE_IDS = 'tinker-hosts-active-ids'

const storage = safeStorage('local')

class Store {
  configs: HostsConfig[] = []
  activeIds: string[] = []
  systemHosts: string = ''
  selectedId: string | 'system' = 'system'
  viewMode: ViewMode = 'system'
  loading: boolean = false
  error: string | null = null
  isDark: boolean = false

  constructor() {
    makeAutoObservable(this)
    this.initTheme()
  }

  private async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'

      // Listen for theme changes
      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        this.isDark = newTheme === 'dark'
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
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

    // Auto-apply hosts if this config is active
    if (contain(this.activeIds, id)) {
      this.applyHosts().catch((error) => {
        console.error('Failed to auto-apply hosts after update:', error)
      })
    }
  }

  addConfig(name: string) {
    const newConfig: HostsConfig = {
      id: uuid(),
      name,
      content: '',
    }

    this.configs = [...this.configs, newConfig]
    this.saveConfigs()
  }

  renameConfig(id: string, newName: string) {
    this.configs = this.configs.map((c) =>
      c.id === id ? { ...c, name: newName } : c
    )
    this.saveConfigs()
  }

  deleteConfig(id: string) {
    remove(this.configs, (c) => c.id === id)
    remove(this.activeIds, (aid) => aid === id)

    this.saveConfigs()
    this.saveActiveIds()
  }

  toggleActive(id: string) {
    const isActive = contain(this.activeIds, id)
    if (isActive) {
      remove(this.activeIds, (aid) => aid === id)
    } else {
      this.activeIds = [...this.activeIds, id]
    }

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

const store = new Store()

export default store
