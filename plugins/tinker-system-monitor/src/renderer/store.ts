import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/store/Base'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import type { DataPoint, ResourceUsagePayload } from '../common/types'
import { buildPayload, snapshotToDataPoint } from './lib/collector'
import { RingBuffer } from './lib/ringBuffer'
import { createMcpApi } from './mcp'

const DEFAULT_INTERVAL = 500
const DEFAULT_HISTORY = 60

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)
  payload: ResourceUsagePayload | null = null
  isLoading = true
  refreshInterval = DEFAULT_INTERVAL
  paused = false
  floatOpen = false
  popupWindow: Window | null = null

  private history = new RingBuffer<DataPoint>(DEFAULT_HISTORY)
  private refreshTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    tinker.setBackgroundThrottling(false)
  }

  async refresh() {
    try {
      const snap = await systemMonitor.getSnapshot()
      const point = snapshotToDataPoint(snap)
      this.history.push(point)
      this.payload = buildPayload(this.history.toArray(), point, snap)
    } catch (error) {
      console.error('Failed to refresh system monitor:', error)
      toast.error(i18n.t('refreshFailed'))
    } finally {
      this.isLoading = false
    }
  }

  togglePaused() {
    this.paused = !this.paused
    if (this.paused) {
      this.stopPolling()
    } else {
      this.startPolling()
    }
  }

  attachPopupWindow(popup: Window | null) {
    this.popupWindow = popup
    this.floatOpen = !!popup
    if (!popup) return
    popup.addEventListener('beforeunload', () => {
      this.floatOpen = false
      this.popupWindow = null
    })
  }

  startPolling() {
    this.stopPolling()
    if (this.paused) return

    this.refresh()
    this.refreshTimer = setInterval(() => {
      if (!this.paused) {
        this.refresh()
      }
    }, this.refreshInterval)
  }

  private stopPolling() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

export default new Store()
