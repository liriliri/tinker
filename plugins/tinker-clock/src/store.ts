import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const storage = new LocalStore('tinker-clock')

type ClockTheme = 'flip' | 'analog' | 'digital'

class Store extends BaseStore {
  theme: ClockTheme = 'flip'
  timezone: string = 'local'

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadTheme()
    this.loadTimezone()
  }

  private loadTheme() {
    const savedTheme = storage.get('theme')
    if (savedTheme) {
      this.theme = savedTheme
    }
  }

  private loadTimezone() {
    const savedTimezone = storage.get('timezone')
    if (savedTimezone) {
      this.timezone = savedTimezone
    }
  }

  setTheme(theme: ClockTheme) {
    this.theme = theme
    storage.set('theme', theme)
  }

  setTimezone(timezone: string) {
    this.timezone = timezone
    storage.set('timezone', timezone)
  }
}

export default new Store()
