import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

type TimestampUnit = 'millisecond' | 'second'
type Timezone = string

const STORAGE_KEY_UNIT = 'timestamp.unit'
const STORAGE_KEY_TIMEZONE = 'timestamp.timezone'
const storage = new LocalStore('tinker-timestamp')

// Timezone key mapping
const TIMEZONE_KEYS: Record<string, string> = {
  'UTC+00:00': 'utcLondon',
  'UTC+01:00': 'utcBerlin',
  'UTC+02:00': 'utcCairo',
  'UTC+03:00': 'utcMoscow',
  'UTC+04:00': 'utcDubai',
  'UTC+05:00': 'utcKarachi',
  'UTC+05:30': 'utcNewDelhi',
  'UTC+06:00': 'utcDhaka',
  'UTC+07:00': 'utcBangkok',
  'UTC+08:00': 'utcBeijing',
  'UTC+09:00': 'utcTokyo',
  'UTC+10:00': 'utcSydney',
  'UTC+11:00': 'utcSolomonIslands',
  'UTC+12:00': 'utcAuckland',
  'UTC-11:00': 'utcSamoa',
  'UTC-10:00': 'utcHawaii',
  'UTC-09:00': 'utcAlaska',
  'UTC-08:00': 'utcLosAngeles',
  'UTC-07:00': 'utcDenver',
  'UTC-06:00': 'utcChicago',
  'UTC-05:00': 'utcNewYork',
  'UTC-04:00': 'utcSantiago',
  'UTC-03:00': 'utcBuenosAires',
  'UTC-02:00': 'utcGreenland',
  'UTC-01:00': 'utcAzores',
}

class Store extends BaseStore {
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
    super()
    makeAutoObservable(this)
    this.loadSettings()
    this.updateCurrentTimestamp()
  }

  loadSettings() {
    const savedUnit = storage.get(STORAGE_KEY_UNIT)
    if (savedUnit === 'millisecond' || savedUnit === 'second') {
      this.timestampUnit = savedUnit
    }

    const savedTimezone = storage.get(STORAGE_KEY_TIMEZONE)
    if (savedTimezone && this.timezones.includes(savedTimezone)) {
      this.timezone = savedTimezone
    }
  }

  updateCurrentTimestamp() {
    setInterval(() => {
      this.currentTimestamp = Date.now()
    }, 1000)
  }

  setTimestampUnit(unit: TimestampUnit) {
    this.timestampUnit = unit
    storage.set(STORAGE_KEY_UNIT, unit)
  }

  setTimezone(timezone: Timezone) {
    this.timezone = timezone
    storage.set(STORAGE_KEY_TIMEZONE, timezone)
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
    // Apply timezone offset
    const localOffset = date.getTimezoneOffset() / 60 // Local timezone offset in hours
    const targetOffset = this.timezoneOffset // Target timezone offset
    const offsetDiff = targetOffset - -localOffset // Difference in hours

    const adjustedDate = new Date(date.getTime() + offsetDiff * 60 * 60 * 1000)
    const timestamp = adjustedDate.getTime()

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

    const date = new Date(ts)

    // Apply timezone offset in reverse
    const localOffset = date.getTimezoneOffset() / 60
    const targetOffset = this.timezoneOffset
    const offsetDiff = targetOffset - -localOffset

    return new Date(date.getTime() - offsetDiff * 60 * 60 * 1000)
  }
}

const store = new Store()

export { TIMEZONE_KEYS }
export default store
