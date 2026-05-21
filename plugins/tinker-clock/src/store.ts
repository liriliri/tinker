import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const storage = new LocalStore('tinker-clock')

const STORAGE_THEME = 'theme'
const STORAGE_TIMEZONE = 'timezone'

type ClockTheme = 'flip' | 'analog' | 'digital'

class Store extends BaseStore {
  theme: ClockTheme = 'flip'
  timezone: string = 'local'

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private loadStorage() {
    const savedTheme = storage.get(STORAGE_THEME)
    if (savedTheme) {
      this.theme = savedTheme
    }
    const savedTimezone = storage.get(STORAGE_TIMEZONE)
    if (savedTimezone) {
      this.timezone = savedTimezone
    }
  }

  setTheme(theme: ClockTheme) {
    this.theme = theme
    storage.set(STORAGE_THEME, theme)
  }

  setTimezone(timezone: string) {
    this.timezone = timezone
    storage.set(STORAGE_TIMEZONE, timezone)
  }
}

export default new Store()
