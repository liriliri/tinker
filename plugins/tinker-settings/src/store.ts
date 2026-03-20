import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

type ApiType = 'openai' | 'claude'

interface AiProvider {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  model: string
  apiType?: ApiType
}

class Store extends BaseStore {
  theme: string = 'system'
  language: string = 'system'
  useNativeTitlebar: boolean = false
  openAtLogin: boolean = false
  silentStart: boolean = false
  showShortcut: string = 'Alt+Space'
  autoHide: boolean = false
  aiProviders: AiProvider[] = []

  isLoading: boolean = true
  currentSection: string = 'general'

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setCurrentSection(section: string) {
    this.currentSection = section
  }

  async loadSettings() {
    const [
      theme,
      language,
      useNativeTitlebar,
      openAtLogin,
      silentStart,
      showShortcut,
      autoHide,
      aiProvidersRaw,
    ] = await Promise.all([
      tinker.getSetting('theme'),
      tinker.getSetting('language'),
      tinker.getSetting('useNativeTitlebar'),
      tinker.getSetting('openAtLogin'),
      tinker.getSetting('silentStart'),
      tinker.getSetting('showShortcut'),
      tinker.getSetting('autoHide'),
      tinker.getSetting('aiProviders'),
    ])

    this.theme = theme ?? 'system'
    this.language = language ?? 'system'
    this.useNativeTitlebar = useNativeTitlebar ?? false
    this.openAtLogin = openAtLogin ?? false
    this.silentStart = silentStart ?? false
    this.showShortcut = showShortcut ?? 'Alt+Space'
    this.autoHide = autoHide ?? false
    this.aiProviders = aiProvidersRaw ? JSON.parse(aiProvidersRaw) : []
    this.isLoading = false
  }

  async setTheme(value: string) {
    this.theme = value
    await tinker.setSetting('theme', value)
  }

  async setLanguage(value: string) {
    this.language = value
    await tinker.setSetting('language', value)
  }

  async setUseNativeTitlebar(value: boolean) {
    this.useNativeTitlebar = value
    await tinker.setSetting('useNativeTitlebar', value)
  }

  async setOpenAtLogin(value: boolean) {
    this.openAtLogin = value
    await tinker.setSetting('openAtLogin', value)
  }

  async setSilentStart(value: boolean) {
    this.silentStart = value
    await tinker.setSetting('silentStart', value)
  }

  async setShowShortcut(value: string) {
    this.showShortcut = value
    await tinker.setSetting('showShortcut', value)
  }

  async setAutoHide(value: boolean) {
    this.autoHide = value
    await tinker.setSetting('autoHide', value)
  }

  async addAiProvider(provider: AiProvider) {
    this.aiProviders = [...this.aiProviders, provider]
    await tinker.setSetting('aiProviders', JSON.stringify(this.aiProviders))
  }

  async updateAiProvider(provider: AiProvider) {
    this.aiProviders = this.aiProviders.map((p) =>
      p.id === provider.id ? provider : p
    )
    await tinker.setSetting('aiProviders', JSON.stringify(this.aiProviders))
  }

  async deleteAiProvider(id: string) {
    this.aiProviders = this.aiProviders.filter((p) => p.id !== id)
    await tinker.setSetting('aiProviders', JSON.stringify(this.aiProviders))
  }
}

export type { ApiType, AiProvider }
export default new Store()
