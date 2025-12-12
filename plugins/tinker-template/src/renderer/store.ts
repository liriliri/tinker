import { makeAutoObservable } from 'mobx'
import safeStorage from 'licia/safeStorage'

const storage = safeStorage('localStorage')

class TemplateStore {
  // UI state
  activeTab: string = 'ui'
  isDark: boolean = false

  // Preload API Tab
  systemInfo: any = null
  currentTime: string = ''

  // Storage Tab
  savedData: string = ''

  constructor() {
    makeAutoObservable(this)
    this.initTheme()
    this.loadSavedData()
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

const store = new TemplateStore()

export default store
