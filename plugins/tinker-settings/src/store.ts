import { makeAutoObservable } from 'mobx'
import clamp from 'licia/clamp'
import clone from 'licia/clone'
import defaults from 'licia/defaults'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import map from 'licia/map'
import remove from 'licia/remove'
import BaseStore from 'share/store/Base'
import type { AiImageProvider, AiMode, AiProvider, Section } from './types'

class Store extends BaseStore {
  theme: string = 'system'
  language: string = 'system'
  useNativeTitlebar: boolean = false
  hardwareAcceleration: boolean = true
  openAtLogin: boolean = false
  silentStart: boolean = false
  showShortcut: string = 'Alt+Space'
  autoHide: boolean = false
  searchLocalApps: boolean = false
  aiProviders: AiProvider[] = []
  aiImageProviders: AiImageProvider[] = []
  npmRegistry: string = 'https://registry.npmmirror.com'
  showMarketplace: boolean = true
  proxyMode: string = 'system'
  proxyHost: string = ''
  enableHttp: boolean = false
  httpPort: number = 9223
  httpUsername: string = ''
  httpPassword: string = ''

  isLoading: boolean = true
  currentSection: Section = 'general'
  aiMode: AiMode = 'chat'
  selectedProviderName: string | null = null
  selectedImageProviderName: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setCurrentSection(section: Section) {
    this.currentSection = section
    this.selectedProviderName = null
    this.selectedImageProviderName = null
  }

  setAiMode(mode: AiMode) {
    this.aiMode = mode
  }

  setSelectedProviderName(name: string | null) {
    this.selectedProviderName = name
  }

  setSelectedImageProviderName(name: string | null) {
    this.selectedImageProviderName = name
  }

  get selectedProvider(): AiProvider | null {
    return (
      find(this.aiProviders, (p) => p.name === this.selectedProviderName) ??
      null
    )
  }

  get selectedImageProvider(): AiImageProvider | null {
    return (
      find(
        this.aiImageProviders,
        (p) => p.name === this.selectedImageProviderName
      ) ?? null
    )
  }

  async loadSettings() {
    const [
      theme,
      language,
      useNativeTitlebar,
      hardwareAcceleration,
      openAtLogin,
      silentStart,
      showShortcut,
      autoHide,
      searchLocalApps,
      aiProvidersRaw,
      aiImageProvidersRaw,
      npmRegistry,
      showMarketplace,
      proxyMode,
      proxyHost,
      enableHttp,
      httpPort,
      httpUsername,
      httpPassword,
    ] = await Promise.all([
      tinker.getSetting('theme'),
      tinker.getSetting('language'),
      tinker.getSetting('useNativeTitlebar'),
      tinker.getSetting('hardwareAcceleration'),
      tinker.getSetting('openAtLogin'),
      tinker.getSetting('silentStart'),
      tinker.getSetting('showShortcut'),
      tinker.getSetting('autoHide'),
      tinker.getSetting('searchLocalApps'),
      tinker.getSetting('aiProviders'),
      tinker.getSetting('aiImageProviders'),
      tinker.getSetting('npmRegistry'),
      tinker.getSetting('showMarketplace'),
      tinker.getSetting('proxyMode'),
      tinker.getSetting('proxyHost'),
      tinker.getSetting('enableHttp'),
      tinker.getSetting('httpPort'),
      tinker.getSetting('httpUsername'),
      tinker.getSetting('httpPassword'),
    ])

    this.theme = theme ?? 'system'
    this.language = language ?? 'system'
    this.useNativeTitlebar = useNativeTitlebar ?? false
    this.hardwareAcceleration = hardwareAcceleration ?? true
    this.openAtLogin = openAtLogin ?? false
    this.silentStart = silentStart ?? false
    this.showShortcut = showShortcut ?? 'Alt+Space'
    this.autoHide = autoHide ?? false
    this.searchLocalApps = searchLocalApps ?? false
    const parsed: AiProvider[] = aiProvidersRaw
      ? JSON.parse(aiProvidersRaw)
      : []
    this.aiProviders = map(parsed, (p) =>
      defaults(clone(p), { apiType: 'openai', models: [] })
    )
    const parsedImage: AiImageProvider[] = aiImageProvidersRaw
      ? JSON.parse(aiImageProvidersRaw)
      : []
    this.aiImageProviders = map(parsedImage, (p) =>
      defaults(clone(p), { apiType: 'openai', models: [] })
    )
    this.npmRegistry = npmRegistry ?? 'https://registry.npmmirror.com'
    this.showMarketplace = showMarketplace !== false
    this.proxyMode = proxyMode ?? 'system'
    this.proxyHost = proxyHost ?? ''
    this.enableHttp = enableHttp === true
    this.httpPort = httpPort || 9223
    this.httpUsername = httpUsername ?? ''
    this.httpPassword = httpPassword ?? ''
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

  async setHardwareAcceleration(value: boolean) {
    this.hardwareAcceleration = value
    await tinker.setSetting('hardwareAcceleration', value)
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

  async setNpmRegistry(value: string) {
    this.npmRegistry = value
    await tinker.setSetting('npmRegistry', value)
  }

  async setShowMarketplace(value: boolean) {
    this.showMarketplace = value
    await tinker.setSetting('showMarketplace', value)
  }

  async setProxyMode(value: string) {
    this.proxyMode = value
    await tinker.setSetting('proxyMode', value)
  }

  async setProxyHost(value: string) {
    this.proxyHost = value
    await tinker.setSetting('proxyHost', value)
  }

  async setEnableHttp(value: boolean) {
    this.enableHttp = value
    await tinker.setSetting('enableHttp', value)
  }

  async setHttpPort(value: number) {
    const port = clamp(value || 9223, 1, 65535)
    this.httpPort = port
    await tinker.setSetting('httpPort', port)
  }

  async setHttpUsername(value: string) {
    this.httpUsername = value
    await tinker.setSetting('httpUsername', value)
  }

  async setHttpPassword(value: string) {
    this.httpPassword = value
    await tinker.setSetting('httpPassword', value)
  }

  private async saveProviders(key: 'aiProviders' | 'aiImageProviders') {
    await tinker.setSetting(key, JSON.stringify(this[key]))
  }

  private updateNamed<T extends { name: string }>(list: T[], item: T) {
    const idx = findIdx(list, (p) => p.name === item.name)
    if (idx !== -1) list[idx] = item
  }

  private reorderList<T>(list: T[], fromIndex: number, toIndex: number) {
    const [item] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, item)
  }

  async addAiProvider(provider: AiProvider) {
    this.aiProviders.push(provider)
    await this.saveProviders('aiProviders')
  }

  async updateAiProvider(provider: AiProvider) {
    this.updateNamed(this.aiProviders, provider)
    await this.saveProviders('aiProviders')
  }

  async deleteAiProvider(name: string) {
    remove(this.aiProviders, (p) => p.name === name)
    if (this.selectedProviderName === name) {
      this.selectedProviderName = null
    }
    await this.saveProviders('aiProviders')
  }

  async reorderAiProviders(fromIndex: number, toIndex: number) {
    this.reorderList(this.aiProviders, fromIndex, toIndex)
    await this.saveProviders('aiProviders')
  }

  async addAiImageProvider(provider: AiImageProvider) {
    this.aiImageProviders.push(provider)
    await this.saveProviders('aiImageProviders')
  }

  async updateAiImageProvider(provider: AiImageProvider) {
    this.updateNamed(this.aiImageProviders, provider)
    await this.saveProviders('aiImageProviders')
  }

  async deleteAiImageProvider(name: string) {
    remove(this.aiImageProviders, (p) => p.name === name)
    if (this.selectedImageProviderName === name) {
      this.selectedImageProviderName = null
    }
    await this.saveProviders('aiImageProviders')
  }

  async reorderAiImageProviders(fromIndex: number, toIndex: number) {
    this.reorderList(this.aiImageProviders, fromIndex, toIndex)
    await this.saveProviders('aiImageProviders')
  }
}

export default new Store()
