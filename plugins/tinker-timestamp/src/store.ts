import { makeAutoObservable } from 'mobx'
import safeStorage from 'licia/safeStorage'

type TimestampUnit = 'millisecond' | 'second'
type Timezone = string

const STORAGE_KEY_UNIT = 'timestamp.unit'
const STORAGE_KEY_TIMEZONE = 'timestamp.timezone'
const storage = safeStorage('local')

class Store {
  isDark: boolean = false
  currentTimestamp: number = Date.now()
  timestampUnit: TimestampUnit = 'millisecond'
  selectedDate: Date = new Date()
  timestampInput: string = ''
  timezone: Timezone = 'UTC+08:00 | 北京'
  timezones: Timezone[] = [
    'UTC+00:00 | 伦敦',
    'UTC+01:00 | 柏林',
    'UTC+02:00 | 开罗',
    'UTC+03:00 | 莫斯科',
    'UTC+04:00 | 迪拜',
    'UTC+05:00 | 卡拉奇',
    'UTC+05:30 | 新德里',
    'UTC+06:00 | 达卡',
    'UTC+07:00 | 曼谷',
    'UTC+08:00 | 北京',
    'UTC+09:00 | 东京',
    'UTC+10:00 | 悉尼',
    'UTC+11:00 | 所罗门群岛',
    'UTC+12:00 | 奥克兰',
    'UTC-11:00 | 萨摩亚',
    'UTC-10:00 | 夏威夷',
    'UTC-09:00 | 阿拉斯加',
    'UTC-08:00 | 洛杉矶',
    'UTC-07:00 | 丹佛',
    'UTC-06:00 | 芝加哥',
    'UTC-05:00 | 纽约',
    'UTC-04:00 | 圣地亚哥',
    'UTC-03:00 | 布宜诺斯艾利斯',
    'UTC-02:00 | 格陵兰',
    'UTC-01:00 | 亚速尔群岛',
  ]

  constructor() {
    makeAutoObservable(this)
    this.loadSettings()
    this.initTheme()
    this.updateCurrentTimestamp()
  }

  loadSettings() {
    const savedUnit = storage.getItem(STORAGE_KEY_UNIT)
    if (savedUnit === 'millisecond' || savedUnit === 'second') {
      this.timestampUnit = savedUnit
    }

    const savedTimezone = storage.getItem(STORAGE_KEY_TIMEZONE)
    if (savedTimezone && this.timezones.includes(savedTimezone)) {
      this.timezone = savedTimezone
    }
  }

  initTheme() {
    const updateTheme = () => {
      this.isDark = document.body.classList.contains('dark')
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  updateCurrentTimestamp() {
    setInterval(() => {
      this.currentTimestamp = Date.now()
    }, 1000)
  }

  setTimestampUnit(unit: TimestampUnit) {
    this.timestampUnit = unit
    storage.setItem(STORAGE_KEY_UNIT, unit)
  }

  setTimezone(timezone: Timezone) {
    this.timezone = timezone
    storage.setItem(STORAGE_KEY_TIMEZONE, timezone)
  }

  setSelectedDate(date: Date) {
    this.selectedDate = date
  }

  setTimestampInput(input: string) {
    this.timestampInput = input
  }

  get currentTimestampDisplay(): string {
    switch (this.timestampUnit) {
      case 'millisecond':
        return this.currentTimestamp.toString()
      case 'second':
        return Math.floor(this.currentTimestamp / 1000).toString()
    }
  }

  get timezoneOffset(): number {
    const match = this.timezone.match(/UTC([+-]\d{2}):(\d{2})/)
    if (!match) return 8
    const hours = parseInt(match[1])
    return hours
  }

  dateToTimestamp(date: Date): string {
    const timestamp = date.getTime()
    switch (this.timestampUnit) {
      case 'millisecond':
        return timestamp.toString()
      case 'second':
        return Math.floor(timestamp / 1000).toString()
    }
  }

  timestampToDate(timestamp: string): Date | null {
    let ts = parseInt(timestamp)
    if (isNaN(ts)) return null

    switch (this.timestampUnit) {
      case 'millisecond':
        // Already in milliseconds
        break
      case 'second':
        ts = ts * 1000
        break
    }

    return new Date(ts)
  }
}

const store = new Store()

export default store
