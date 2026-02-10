import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'
import type { SystemInfoData } from '../preload'

class Store extends BaseStore {
  systemInfo: SystemInfoData | null = null
  isLoading: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.fetchSystemInfo()
  }

  async fetchSystemInfo() {
    this.isLoading = true
    try {
      const info = await systemInfo.getSystemInfo()
      this.systemInfo = info
    } catch (error) {
      console.error('Failed to fetch system info:', error)
      alert({ title: 'Failed to fetch system info' })
    } finally {
      this.isLoading = false
    }
  }
}

const store = new Store()

export default store
