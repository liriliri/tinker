import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const storage = new LocalStore('tinker-pomodoro')

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

class Store extends BaseStore {
  // Timer state
  mode: TimerMode = 'focus'
  timeLeft: number = 25 * 60 // seconds
  isRunning: boolean = false
  currentRound: number = 1
  totalRounds: number = 4

  // Timer settings (minutes)
  focusTime: number = 25
  shortBreakTime: number = 5
  longBreakTime: number = 15

  // Timer interval ID
  private timerId: number | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSettings()
  }

  private loadSettings() {
    const savedFocus = storage.get('focus-time')
    const savedShortBreak = storage.get('short-break-time')
    const savedLongBreak = storage.get('long-break-time')

    if (savedFocus) this.focusTime = savedFocus
    if (savedShortBreak) this.shortBreakTime = savedShortBreak
    if (savedLongBreak) this.longBreakTime = savedLongBreak

    this.timeLeft = this.focusTime * 60
  }

  // Timer controls
  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.timerId = window.setInterval(() => {
      this.tick()
    }, 1000)
  }

  pause() {
    this.isRunning = false
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  reset() {
    this.pause()
    this.currentRound = 1
    this.mode = 'focus'
    this.timeLeft = this.focusTime * 60
  }

  skip() {
    this.pause()
    this.nextRound()
  }

  private tick() {
    if (this.timeLeft > 0) {
      this.timeLeft--
    } else {
      this.pause()
      this.onTimerComplete()
    }
  }

  private onTimerComplete() {
    // Play notification sound or show notification
    this.nextRound()
  }

  private nextRound() {
    if (this.mode === 'focus') {
      if (this.currentRound >= this.totalRounds) {
        this.mode = 'longBreak'
        this.timeLeft = this.longBreakTime * 60
        this.currentRound = 1
      } else {
        this.mode = 'shortBreak'
        this.timeLeft = this.shortBreakTime * 60
        this.currentRound++
      }
    } else {
      this.mode = 'focus'
      this.timeLeft = this.focusTime * 60
    }
  }

  // Getters
  get progress(): number {
    const totalTime = this.getTotalTimeForMode()
    return ((totalTime - this.timeLeft) / totalTime) * 100
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60)
    const seconds = this.timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
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
