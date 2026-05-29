import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import type { DataPoint, ResourceUsagePayload } from '../common/types'
import {
  buildPayload,
  computeUnavailableMetrics,
  snapshotToDataPoint,
} from './lib/collector'
import { RingBuffer } from './lib/ringBuffer'

const DEFAULT_INTERVAL = 2000
const DEFAULT_HISTORY = 60

class Store extends BaseStore {
  payload: ResourceUsagePayload | null = null
  isLoading = true
  refreshInterval = DEFAULT_INTERVAL
  paused = false

  private history = new RingBuffer<DataPoint>(DEFAULT_HISTORY)
  private refreshTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.startPolling()
  }

  async refresh() {
    try {
      const snap = await systemMonitor.getSnapshot()
      snap.unavailableMetrics = computeUnavailableMetrics(snap)
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

  private startPolling() {
    this.stopPolling()
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
