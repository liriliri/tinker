import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { formatMs, pad } from './lib/util'
import i18n from './i18n'

const storage = new LocalStore('tinker-timer')

export interface Lap {
  index: number
  lapTime: number
  total: number
}

type Tab = 'stopwatch' | 'countdown'

class Store extends BaseStore {
  tab: Tab = 'stopwatch'

  swRunning: boolean = false
  swElapsed: number = 0
  swLaps: Lap[] = []

  cdHours: number = 0
  cdMinutes: number = 15
  cdSeconds: number = 0

  cdRunning: boolean = false
  cdElapsed: number = 0
  cdCompleted: boolean = false

  private swStartTime: number = 0
  private swBaseElapsed: number = 0
  private swRafId: number | null = null

  private cdStartTime: number = 0
  private cdBaseElapsed: number = 0
  private cdRafId: number | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private loadStorage() {
    const savedTab = storage.get('tab') as Tab | undefined
    if (savedTab) this.tab = savedTab

    const savedCdH = storage.get('cdHours')
    const savedCdM = storage.get('cdMinutes')
    const savedCdS = storage.get('cdSeconds')
    if (savedCdH !== undefined) this.cdHours = savedCdH
    if (savedCdM !== undefined) this.cdMinutes = savedCdM
    if (savedCdS !== undefined) this.cdSeconds = savedCdS
  }

  setTab(tab: Tab) {
    this.tab = tab
    storage.set('tab', tab)
  }

  swStart() {
    if (this.swRunning) return
    this.swRunning = true
    this.swStartTime = performance.now()
    this.swBaseElapsed = this.swElapsed
    this.swTick()
  }

  swPause() {
    if (!this.swRunning) return
    this.swRunning = false
    if (this.swRafId !== null) {
      cancelAnimationFrame(this.swRafId)
      this.swRafId = null
    }
    this.swElapsed = this.swBaseElapsed + (performance.now() - this.swStartTime)
  }

  swReset() {
    this.swPause()
    this.swElapsed = 0
    this.swBaseElapsed = 0
    this.swLaps = []
  }

  swLap() {
    if (!this.swRunning) return
    const total = this.swElapsed
    const prevTotal =
      this.swLaps.length > 0 ? this.swLaps[this.swLaps.length - 1].total : 0
    this.swLaps.push({
      index: this.swLaps.length + 1,
      lapTime: total - prevTotal,
      total,
    })
  }

  private swTick() {
    this.swRafId = requestAnimationFrame(() => {
      runInAction(() => {
        if (!this.swRunning) return
        this.swElapsed =
          this.swBaseElapsed + (performance.now() - this.swStartTime)
      })
      if (this.swRunning) this.swTick()
    })
  }

  get swDisplay(): string {
    return formatMs(this.swElapsed)
  }

  get swDisplayParts(): [string, string, string] {
    const ms = this.swElapsed
    const cs = Math.floor(ms / 10) % 100
    const s = Math.floor(ms / 1000) % 60
    const m = Math.floor(ms / 60000)
    return [pad(m), pad(s), pad(cs)]
  }

  get swCurrentLapTime(): number {
    const prevTotal =
      this.swLaps.length > 0 ? this.swLaps[this.swLaps.length - 1].total : 0
    return this.swElapsed - prevTotal
  }

  get swLapsReversed(): Lap[] {
    return [...this.swLaps].reverse()
  }

  get swFastestIndex(): number {
    return this.swLaps.length >= 2
      ? this.swLaps.reduce((a, b) => (b.lapTime < a.lapTime ? b : a)).index
      : -1
  }

  get swSlowestIndex(): number {
    return this.swLaps.length >= 2
      ? this.swLaps.reduce((a, b) => (b.lapTime > a.lapTime ? b : a)).index
      : -1
  }

  get cdCanStart(): boolean {
    return this.cdHours + this.cdMinutes + this.cdSeconds > 0
  }

  get cdTotal(): number {
    return (this.cdHours * 3600 + this.cdMinutes * 60 + this.cdSeconds) * 1000
  }

  get cdRemaining(): number {
    return Math.max(0, this.cdTotal - this.cdElapsed)
  }

  get cdIsIdle(): boolean {
    return !this.cdRunning && this.cdElapsed === 0 && !this.cdCompleted
  }

  get cdDisplayH(): number {
    return Math.floor(this.cdRemaining / 3600000)
  }

  get cdDisplayM(): number {
    return Math.floor((this.cdRemaining % 3600000) / 60000)
  }

  get cdDisplayS(): number {
    return Math.floor((this.cdRemaining % 60000) / 1000)
  }

  setCdHours(h: number) {
    this.cdHours = Math.max(0, Math.min(23, Math.floor(h)))
    storage.set('cdHours', this.cdHours)
  }

  setCdMinutes(m: number) {
    this.cdMinutes = Math.max(0, Math.min(59, Math.floor(m)))
    storage.set('cdMinutes', this.cdMinutes)
  }

  setCdSeconds(s: number) {
    this.cdSeconds = Math.max(0, Math.min(59, Math.floor(s)))
    storage.set('cdSeconds', this.cdSeconds)
  }

  cdStart() {
    if (this.cdRunning || this.cdTotal === 0) return
    this.cdCompleted = false
    this.cdRunning = true
    this.cdStartTime = performance.now()
    this.cdBaseElapsed = this.cdElapsed
    this.cdTick()
  }

  cdPause() {
    if (!this.cdRunning) return
    this.cdRunning = false
    if (this.cdRafId !== null) {
      cancelAnimationFrame(this.cdRafId)
      this.cdRafId = null
    }
    this.cdElapsed = this.cdBaseElapsed + (performance.now() - this.cdStartTime)
  }

  cdReset() {
    this.cdPause()
    this.cdElapsed = 0
    this.cdBaseElapsed = 0
    this.cdCompleted = false
  }

  private cdTick() {
    this.cdRafId = requestAnimationFrame(() => {
      runInAction(() => {
        if (!this.cdRunning) return
        const elapsed =
          this.cdBaseElapsed + (performance.now() - this.cdStartTime)
        if (elapsed >= this.cdTotal) {
          this.cdElapsed = this.cdTotal
          this.cdRunning = false
          this.cdCompleted = true
          this.cdRafId = null
          this.playBeep()
          tinker.showNotification(i18n.t('countdownComplete'))
        } else {
          this.cdElapsed = elapsed
        }
      })
      if (this.cdRunning) this.cdTick()
    })
  }

  private playBeep() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const t = ctx.currentTime
      const notes = [880, 1100, 1320]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const start = t + i * 0.5
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.3, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.4)
      })
    } catch {
      // ignore
    }
  }
}

export default new Store()
