import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { AiProvider, Section } from './types'

class Store extends BaseStore {
  theme: string = 'system'
  language: string = 'system'
  useNativeTitlebar: boolean = false
  openAtLogin: boolean = false
  silentStart: boolean = false
  showShortcut: string = 'Alt+Space'
  autoHide: boolean = false
  searchLocalApps: boolean = true
  aiProviders: AiProvider[] = []

  isLoading: boolean = true
  currentSection: Section = 'general'
  selectedProviderName: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setCurrentSection(section: Section) {
    this.currentSection = section
    this.selectedProviderName = null
  }

  setSelectedProviderName(name: string | null) {
    this.selectedProviderName = name
  }

  get selectedProvider(): AiProvider | null {
    return (
      this.aiProviders.find((p) => p.name === this.selectedProviderName) ?? null
    )
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
      searchLocalApps,
      aiProvidersRaw,
    ] = await Promise.all([
      tinker.getSetting('theme'),
      tinker.getSetting('language'),
      tinker.getSetting('useNativeTitlebar'),
      tinker.getSetting('openAtLogin'),
      tinker.getSetting('silentStart'),
      tinker.getSetting('showShortcut'),
      tinker.getSetting('autoHide'),
      tinker.getSetting('searchLocalApps'),
      tinker.getSetting('aiProviders'),
    ])

    this.theme = theme ?? 'system'
    this.language = language ?? 'system'
    this.useNativeTitlebar = useNativeTitlebar ?? false
    this.openAtLogin = openAtLogin ?? false
    this.silentStart = silentStart ?? false
    this.showShortcut = showShortcut ?? 'Alt+Space'
    this.autoHide = autoHide ?? false
    this.searchLocalApps = searchLocalApps ?? true
    const parsed: AiProvider[] = aiProvidersRaw
      ? JSON.parse(aiProvidersRaw)
      : []
    this.aiProviders = parsed.map((p) => ({
      ...p,
      apiType: p.apiType ?? 'openai',
      models: p.models ?? [],
    }))
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

  async setSearchLocalApps(value: boolean) {
    this.searchLocalApps = value
    await tinker.setSetting('searchLocalApps', value)
  }

  private async saveAiProviders() {
    await tinker.setSetting('aiProviders', JSON.stringify(this.aiProviders))
  }

  async addAiProvider(provider: AiProvider) {
    this.aiProviders.push(provider)
    await this.saveAiProviders()
  }

  async updateAiProvider(provider: AiProvider) {
    const idx = this.aiProviders.findIndex((p) => p.name === provider.name)
    if (idx !== -1) this.aiProviders[idx] = provider
    await this.saveAiProviders()
  }

  async deleteAiProvider(name: string) {
    const idx = this.aiProviders.findIndex((p) => p.name === name)
    if (idx !== -1) this.aiProviders.splice(idx, 1)
    if (this.selectedProviderName === name) {
      this.selectedProviderName = null
    }
    await this.saveAiProviders()
  }

  async reorderAiProviders(fromIndex: number, toIndex: number) {
    const [item] = this.aiProviders.splice(fromIndex, 1)
    this.aiProviders.splice(toIndex, 0, item)
    await this.saveAiProviders()
  }
}

export default new Store()
