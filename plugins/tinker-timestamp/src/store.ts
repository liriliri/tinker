import { makeAutoObservable } from 'mobx'
import safeStorage from 'licia/safeStorage'

type TimestampUnit = 'millisecond' | 'second'
type Timezone = string

const STORAGE_KEY_UNIT = 'timestamp.unit'
const STORAGE_KEY_TIMEZONE = 'timestamp.timezone'
const storage = safeStorage('local')

// Timezone key mapping
const TIMEZONE_KEYS: Record<string, string> = {
  'UTC+00:00': 'utc_p_00_00',
  'UTC+01:00': 'utc_p_01_00',
  'UTC+02:00': 'utc_p_02_00',
  'UTC+03:00': 'utc_p_03_00',
  'UTC+04:00': 'utc_p_04_00',
  'UTC+05:00': 'utc_p_05_00',
  'UTC+05:30': 'utc_p_05_30',
  'UTC+06:00': 'utc_p_06_00',
  'UTC+07:00': 'utc_p_07_00',
  'UTC+08:00': 'utc_p_08_00',
  'UTC+09:00': 'utc_p_09_00',
  'UTC+10:00': 'utc_p_10_00',
  'UTC+11:00': 'utc_p_11_00',
  'UTC+12:00': 'utc_p_12_00',
  'UTC-11:00': 'utc_m_11_00',
  'UTC-10:00': 'utc_m_10_00',
  'UTC-09:00': 'utc_m_09_00',
  'UTC-08:00': 'utc_m_08_00',
  'UTC-07:00': 'utc_m_07_00',
  'UTC-06:00': 'utc_m_06_00',
  'UTC-05:00': 'utc_m_05_00',
  'UTC-04:00': 'utc_m_04_00',
  'UTC-03:00': 'utc_m_03_00',
  'UTC-02:00': 'utc_m_02_00',
  'UTC-01:00': 'utc_m_01_00',
}

class Store {
  isDark: boolean = false
  currentTimestamp: number = Date.now()
  timestampUnit: TimestampUnit = 'millisecond'
  selectedDate: Date = new Date()
  timestampInput: string = ''
  timezone: Timezone = 'UTC+08:00'
  timezones: Timezone[] = [
    'UTC+00:00',
    'UTC+01:00',
    'UTC+02:00',
    'UTC+03:00',
    'UTC+04:00',
    'UTC+05:00',
    'UTC+05:30',
    'UTC+06:00',
    'UTC+07:00',
    'UTC+08:00',
    'UTC+09:00',
    'UTC+10:00',
    'UTC+11:00',
    'UTC+12:00',
    'UTC-11:00',
    'UTC-10:00',
    'UTC-09:00',
    'UTC-08:00',
    'UTC-07:00',
    'UTC-06:00',
    'UTC-05:00',
    'UTC-04:00',
    'UTC-03:00',
    'UTC-02:00',
    'UTC-01:00',
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

  getTimezoneKey(timezone: string): string {
    return TIMEZONE_KEYS[timezone] || timezone
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

export { TIMEZONE_KEYS }
export default store
