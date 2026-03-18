import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  theme: string = 'system'
  language: string = 'system'
  useNativeTitlebar: boolean = false
  openAtLogin: boolean = false
  silentStart: boolean = false
  showShortcut: string = 'Alt+Space'
  autoHide: boolean = false

  isLoading: boolean = true

  constructor() {
    super()
    makeAutoObservable(this)
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
    ] = await Promise.all([
      tinker.getSetting('theme'),
      tinker.getSetting('language'),
      tinker.getSetting('useNativeTitlebar'),
      tinker.getSetting('openAtLogin'),
      tinker.getSetting('silentStart'),
      tinker.getSetting('showShortcut'),
      tinker.getSetting('autoHide'),
    ])

    this.theme = theme ?? 'system'
    this.language = language ?? 'system'
    this.useNativeTitlebar = useNativeTitlebar ?? false
    this.openAtLogin = openAtLogin ?? false
    this.silentStart = silentStart ?? false
    this.showShortcut = showShortcut ?? 'Alt+Space'
    this.autoHide = autoHide ?? false
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
}

export default new Store()
