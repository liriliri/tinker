import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import durationFormat from 'licia/durationFormat'
import clamp from 'licia/clamp'
import BaseStore from 'share/BaseStore'
import TimerWorker from './lib/timer.worker?worker'

const storage = new LocalStore('tinker-pomodoro')

const STORAGE_FOCUS_TIME = 'focus-time'
const STORAGE_SHORT_BREAK_TIME = 'short-break-time'
const STORAGE_LONG_BREAK_TIME = 'long-break-time'
const STORAGE_TOTAL_FOCUS_COMPLETED = 'total-focus-completed'
const STORAGE_VOLUME = 'volume'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

class Store extends BaseStore {
  mode: TimerMode = 'focus'
  timeLeft: number = 25 * 60
  isRunning: boolean = false
  currentRound: number = 1
  totalRounds: number = 4
  totalFocusCompleted: number = 0

  focusTime: number = 25
  shortBreakTime: number = 5
  longBreakTime: number = 15

  volume: number = 100

  private worker: Worker | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.initWorker()
  }

  private initWorker() {
    this.worker = new TimerWorker()
    this.worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data

      switch (type) {
        case 'tick':
          this.timeLeft = this.getTotalTimeForMode() - payload.elapsed
          break
        case 'complete':
          this.isRunning = false
          this.timeLeft = 0
          this.onTimerComplete()
          break
      }
    }
  }

  private loadStorage() {
    const savedFocus = storage.get(STORAGE_FOCUS_TIME)
    const savedShortBreak = storage.get(STORAGE_SHORT_BREAK_TIME)
    const savedLongBreak = storage.get(STORAGE_LONG_BREAK_TIME)
    const savedTotalFocus = storage.get(STORAGE_TOTAL_FOCUS_COMPLETED)
    const savedVolume = storage.get(STORAGE_VOLUME)

    if (savedFocus) this.focusTime = savedFocus
    if (savedShortBreak) this.shortBreakTime = savedShortBreak
    if (savedLongBreak) this.longBreakTime = savedLongBreak
    if (savedTotalFocus) this.totalFocusCompleted = savedTotalFocus
    if (savedVolume !== undefined) this.volume = savedVolume

    this.timeLeft = this.focusTime * 60
  }

  start() {
    if (this.isRunning || !this.worker) return

    this.isRunning = true
    const elapsed = this.getTotalTimeForMode() - this.timeLeft
    this.worker.postMessage({
      type: 'start',
      payload: {
        totalSeconds: this.getTotalTimeForMode(),
        elapsed,
      },
    })
  }

  pause() {
    if (!this.isRunning || !this.worker) return

    this.isRunning = false
    this.worker.postMessage({ type: 'pause' })
  }

  reset() {
    this.pause()
    this.currentRound = 1
    this.mode = 'focus'
    this.timeLeft = this.focusTime * 60
    this.totalFocusCompleted = 0
    storage.set(STORAGE_TOTAL_FOCUS_COMPLETED, 0)
    if (this.worker) {
      this.worker.postMessage({ type: 'reset' })
    }
  }

  skip() {
    this.pause()
    if (this.worker) {
      this.worker.postMessage({ type: 'reset' })
    }
    this.nextRound()
  }

  setVolume(value: number) {
    this.volume = clamp(value, 0, 100)
    storage.set(STORAGE_VOLUME, this.volume)
  }

  toggleMute() {
    if (this.volume === 0) {
      this.setVolume(100)
    } else {
      this.setVolume(0)
    }
  }

  private onTimerComplete() {
    this.playCompletionSound()
    this.nextRound()
  }

  private playCompletionSound() {
    if (this.volume === 0) return

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AudioContextClass) return
      const audioCtx = new AudioContextClass()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
      const volumeGain = (this.volume / 100) * 0.3
      gainNode.gain.setValueAtTime(volumeGain, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.5
      )

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.5)
    } catch (error) {
      console.error('Failed to play completion sound:', error)
    }
  }

  private nextRound() {
    if (this.mode === 'focus') {
      this.totalFocusCompleted++
      storage.set(STORAGE_TOTAL_FOCUS_COMPLETED, this.totalFocusCompleted)

      if (this.currentRound >= this.totalRounds) {
        this.mode = 'longBreak'
        this.timeLeft = this.longBreakTime * 60
      } else {
        this.mode = 'shortBreak'
        this.timeLeft = this.shortBreakTime * 60
      }
    } else if (this.mode === 'shortBreak') {
      this.mode = 'focus'
      this.timeLeft = this.focusTime * 60
      this.currentRound++
    } else {
      this.mode = 'focus'
      this.timeLeft = this.focusTime * 60
      this.currentRound = 1
    }
  }

  get progress(): number {
    const totalTime = this.getTotalTimeForMode()
    return ((totalTime - this.timeLeft) / totalTime) * 100
  }

  get formattedTime(): string {
    return durationFormat(this.timeLeft * 1000, 'mm:ss')
  }

  private getTotalTimeForMode(): number {
    switch (this.mode) {
      case 'focus':
        return this.focusTime * 60
      case 'shortBreak':
        return this.shortBreakTime * 60
      case 'longBreak':
        return this.longBreakTime * 60
    }
  }
}

export default new Store()
