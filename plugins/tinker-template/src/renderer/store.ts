import { makeAutoObservable } from 'mobx'
import safeStorage from 'licia/safeStorage'
import BaseStore from 'share/BaseStore'

const storage = safeStorage('localStorage')

class Store extends BaseStore {
  // UI state
  activeTab: string = 'ui'

  // Preload API Tab
  systemInfo: any = null
  currentTime: string = ''

  // Storage Tab
  savedData: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSavedData()
  }

  private loadSavedData() {
    const saved = storage.getItem('template-saved-data')
    if (saved) {
      this.savedData = saved
    }
  }

  // Tab navigation
  setActiveTab(tabId: string) {
    this.activeTab = tabId
  }

  // Preload API Tab
  getSystemInfo() {
    try {
      const info = template.getSystemInfo()
      this.systemInfo = info
    } catch (error) {
      alert('Failed to get system info')
    }
  }

  getCurrentTime() {
    try {
      const time = template.getCurrentTime()
      this.currentTime = time
    } catch (error) {
      alert('Failed to get current time')
    }
  }

  // Storage Tab
  setSavedData(data: string) {
    this.savedData = data
  }

  saveData() {
    storage.setItem('template-saved-data', this.savedData)
    alert('Data saved to localStorage!')
  }

  clearData() {
    storage.removeItem('template-saved-data')
    this.savedData = ''
    alert('Data cleared!')
  }
}

const store = new Store()

export default store
