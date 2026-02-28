import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'

const SAVED_DATA_KEY = 'saved-data'

const storage = new LocalStore('tinker-template')

type SystemInfo = {
  platform: string
  arch: string
  homeDir: string
  nodeVersion: string
}

class Store extends BaseStore {
  activeTab: string = 'preload'

  systemInfo: SystemInfo | null = null
  currentTime: string = ''

  savedData: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const saved = storage.get(SAVED_DATA_KEY)
    if (saved) {
      this.savedData = saved
    }
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId
  }

  getSystemInfo() {
    try {
      const info = template.getSystemInfo()
      this.systemInfo = info
    } catch {
      alert({ title: 'Failed to get system info' })
    }
  }

  getCurrentTime() {
    try {
      const time = template.getCurrentTime()
      this.currentTime = time
    } catch {
      alert({ title: 'Failed to get current time' })
    }
  }

  setSavedData(data: string) {
    this.savedData = data
  }

  saveData() {
    storage.set(SAVED_DATA_KEY, this.savedData)
    alert({ title: 'Data saved to localStorage!' })
  }

  clearData() {
    storage.remove(SAVED_DATA_KEY)
    this.savedData = ''
    alert({ title: 'Data cleared!' })
  }
}

export default new Store()
