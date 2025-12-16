import { makeAutoObservable, toJS } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import contain from 'licia/contain'
import remove from 'licia/remove'
import { HostsConfig, ViewMode } from './types'
import BaseStore from 'share/BaseStore'
import i18n from './i18n'

const STORAGE_KEY_CONFIGS = 'configs'
const STORAGE_KEY_ACTIVE_IDS = 'active-ids'

const storage = new LocalStore('tinker-hosts')

class Store extends BaseStore {
  configs: HostsConfig[] = []
  activeIds: string[] = []
  systemHosts: string = ''
  selectedId: string | 'system' = 'system'
  viewMode: ViewMode = 'system'
  loading: boolean = false
  error: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      const savedConfigs = storage.get(STORAGE_KEY_CONFIGS)
      const savedActiveIds = storage.get(STORAGE_KEY_ACTIVE_IDS)

      if (savedConfigs) {
        this.configs = JSON.parse(savedConfigs)
      }

      if (savedActiveIds) {
        this.activeIds = JSON.parse(savedActiveIds)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      this.error = i18n.t('loadConfigFailed', {
        message:
          error instanceof Error ? error.message : i18n.t('unknownError'),
      })
    }
  }

  saveConfigs() {
    try {
      storage.set(STORAGE_KEY_CONFIGS, JSON.stringify(this.configs))
    } catch (error) {
      console.error('Failed to save configs:', error)
      this.error = i18n.t('saveConfigFailed', {
        message:
          error instanceof Error ? error.message : i18n.t('unknownError'),
      })
    }
  }

  saveActiveIds() {
    try {
      storage.set(STORAGE_KEY_ACTIVE_IDS, JSON.stringify(this.activeIds))
    } catch (error) {
      console.error('Failed to save active IDs:', error)
      this.error = i18n.t('saveConfigFailed', {
        message:
          error instanceof Error ? error.message : i18n.t('unknownError'),
      })
    }
  }

  async loadSystemHosts() {
    try {
      const systemHosts = await hosts.readSystemHosts()
      this.systemHosts = systemHosts
    } catch (error) {
      console.error('Failed to load system hosts:', error)
      const errorMsg =
        error instanceof Error ? error.message : i18n.t('unknownError')
      this.error = i18n.t('readSystemHostsFailed', { message: errorMsg })
      this.systemHosts = `# ${i18n.t('cannotReadSystemHosts')}\n# ${i18n.t(
        'readSystemHostsFailed',
        { message: errorMsg }
      )}`
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
    // Check if this config was active
    const wasActive = contain(this.activeIds, id)

    // If the deleted config is currently selected, switch to system view
    if (this.selectedId === id) {
      this.setViewMode('system')
    }

    remove(this.configs, (c) => c.id === id)
    remove(this.activeIds, (aid) => aid === id)

    this.saveConfigs()
    this.saveActiveIds()

    // If the deleted config was active, apply hosts to update system
    if (wasActive) {
      this.applyHosts().catch((error) => {
        console.error(
          'Failed to apply hosts after deleting active config:',
          error
        )
      })
    }
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
      await hosts.applyHosts(toJS(this.activeIds), toJS(this.configs))
      await this.loadSystemHosts()
    } catch (error) {
      console.error('Failed to apply hosts:', error)
      throw error
    }
  }
}

const store = new Store()

export default store
