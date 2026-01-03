import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import durationFormat from 'licia/durationFormat'
import BaseStore from 'share/BaseStore'
import TimerWorker from './utils/timer.worker?worker'

const storage = new LocalStore('tinker-pomodoro')

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

class Store extends BaseStore {
  // Timer state
  mode: TimerMode = 'focus'
  timeLeft: number = 25 * 60 // seconds
  isRunning: boolean = false
  currentRound: number = 1
  totalRounds: number = 4
  totalFocusCompleted: number = 0 // Total focus sessions completed

  // Timer settings (minutes)
  focusTime: number = 25
  shortBreakTime: number = 5
  longBreakTime: number = 15

  // Audio settings
  volume: number = 100 // 0-100

  // Web Worker
  private worker: Worker | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSettings()
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

  private loadSettings() {
    const savedFocus = storage.get('focus-time')
    const savedShortBreak = storage.get('short-break-time')
    const savedLongBreak = storage.get('long-break-time')
    const savedTotalFocus = storage.get('total-focus-completed')
    const savedVolume = storage.get('volume')

    if (savedFocus) this.focusTime = savedFocus
    if (savedShortBreak) this.shortBreakTime = savedShortBreak
    if (savedLongBreak) this.longBreakTime = savedLongBreak
    if (savedTotalFocus) this.totalFocusCompleted = savedTotalFocus
    if (savedVolume !== undefined) this.volume = savedVolume

    this.timeLeft = this.focusTime * 60
  }

  // Timer controls
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
    storage.set('total-focus-completed', 0)
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
    this.volume = Math.max(0, Math.min(100, value))
    storage.set('volume', this.volume)
  }

  toggleMute() {
    if (this.volume === 0) {
      this.setVolume(100)
    } else {
      this.setVolume(0)
    }
  }

  private onTimerComplete() {
    // Play notification sound
    this.playCompletionSound()
    this.nextRound()
  }

  private playCompletionSound() {
    if (this.volume === 0) return

    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
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
      // Completed a focus session, increment total count
      this.totalFocusCompleted++
      storage.set('total-focus-completed', this.totalFocusCompleted)

      if (this.currentRound >= this.totalRounds) {
        // After the last focus session, go to long break
        this.mode = 'longBreak'
        this.timeLeft = this.longBreakTime * 60
      } else {
        // Go to short break, keep current round number
        this.mode = 'shortBreak'
        this.timeLeft = this.shortBreakTime * 60
      }
    } else if (this.mode === 'shortBreak') {
      // Completed short break, start next focus round
      this.mode = 'focus'
      this.timeLeft = this.focusTime * 60
      this.currentRound++
    } else {
      // Completed long break, reset to round 1
      this.mode = 'focus'
      this.timeLeft = this.focusTime * 60
      this.currentRound = 1
    }
  }

  // Getters
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

const store = new Store()

export default store
