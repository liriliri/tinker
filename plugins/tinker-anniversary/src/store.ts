import { makeAutoObservable } from 'mobx'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import flatten from 'licia/flatten'
import isNil from 'licia/isNil'
import LocalStore from 'licia/LocalStore'
import map from 'licia/map'
import toInt from 'licia/toInt'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import BaseStore from 'share/store/Base'
import { createDateTime, normalizeDateKey } from './lib/date'
import {
  getAnniversaryDatesInRange,
  getSidebarItems,
  toAnniversary,
} from './lib/anniversary'
import { getHolidaysForYearRange } from 'share/lib/holidays'
import * as db from './lib/db'
import type { Anniversary } from './types'
import i18n from 'i18next'

const storage = new LocalStore('tinker-anniversary')
const STORAGE_SIDEBAR_OPEN = 'sidebar-open'
const STORAGE_SHOW_HOLIDAYS = 'show-holidays'
const DEFAULT_VISIBLE_START = normalizeDateKey(new Date())
const DEFAULT_VISIBLE_END = DEFAULT_VISIBLE_START

class Store extends BaseStore {
  selectedDate: string = this.getTodayKey()
  anniversaries: Anniversary[] = []
  sidebarOpen: boolean = true
  showHolidays: boolean = true
  dialogOpen: boolean = false
  dialogDate: string = ''
  editingAnniversaryId: string | null = null
  visibleStart: string = DEFAULT_VISIBLE_START
  visibleEnd: string = DEFAULT_VISIBLE_END

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private getTodayKey() {
    return normalizeDateKey(new Date())
  }

  private async loadStorage() {
    try {
      const savedSidebar = storage.get(STORAGE_SIDEBAR_OPEN)
      if (!isNil(savedSidebar)) {
        this.sidebarOpen = savedSidebar as boolean
      }

      const savedHolidays = storage.get(STORAGE_SHOW_HOLIDAYS)
      if (!isNil(savedHolidays)) {
        this.showHolidays = savedHolidays as boolean
      }

      this.anniversaries = await db.getAllAnniversaries()
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  }

  setSelectedDate(value: string | Date) {
    this.selectedDate = normalizeDateKey(value)
  }

  setToday() {
    this.selectedDate = this.getTodayKey()
  }

  setVisibleRange(start: Date, end: Date) {
    this.visibleStart = normalizeDateKey(start)
    this.visibleEnd = normalizeDateKey(end)
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setShowHolidays(value: boolean) {
    this.showHolidays = value
    storage.set(STORAGE_SHOW_HOLIDAYS, value)
  }

  openAnniversaryDialog(date: string, anniversaryId?: string) {
    this.dialogDate = date
    this.editingAnniversaryId = anniversaryId || null
    this.dialogOpen = true
  }

  closeAnniversaryDialog() {
    this.dialogOpen = false
    this.editingAnniversaryId = null
  }

  addAnniversary(data: Omit<Anniversary, 'id'>) {
    const anniversary = toAnniversary(uuid(), data)

    this.anniversaries = [...this.anniversaries, anniversary]
    db.addAnniversary(anniversary)
  }

  updateAnniversary(id: string, data: Omit<Anniversary, 'id'>) {
    if (!trim(data.title)) return

    const idx = findIdx(this.anniversaries, (item) => item.id === id)
    if (idx === -1) return

    const updated = toAnniversary(id, data)

    this.anniversaries = this.anniversaries.map((item, i) =>
      i === idx ? updated : item
    )
    db.updateAnniversary(updated)
  }

  removeAnniversary(id: string) {
    this.anniversaries = this.anniversaries.filter((item) => item.id !== id)
    db.removeAnniversary(id)
  }

  get holidayEvents() {
    if (!this.showHolidays) return []

    const startYear = toInt(this.visibleStart.slice(0, 4))
    const endYear = toInt(this.visibleEnd.slice(0, 4))
    const holidays = getHolidaysForYearRange(startYear, endYear, i18n.language)

    return holidays
      .filter(
        (holiday) =>
          holiday.date >= this.visibleStart && holiday.date <= this.visibleEnd
      )
      .map((holiday) => ({
        id: holiday.id,
        title: holiday.nameKey,
        start: createDateTime(holiday.date, '00:00'),
        allDay: true,
        classNames: ['holiday-event'],
        editable: false,
        order: 0,
      }))
  }

  get anniversaryEvents() {
    return flatten(
      map(this.anniversaries, (anniversary) =>
        map(
          getAnniversaryDatesInRange(
            anniversary,
            this.visibleStart,
            this.visibleEnd
          ),
          (item) => ({
            id: item.id,
            title: item.title,
            start: createDateTime(item.date, '00:00'),
            allDay: true,
            order: 1,
            extendedProps: { anniversaryId: anniversary.id },
          })
        )
      )
    )
  }

  get calendarEvents() {
    return [...this.holidayEvents, ...this.anniversaryEvents]
  }

  get sidebarItems() {
    return getSidebarItems(this.anniversaries, this.showHolidays, i18n.language)
  }

  getAnniversaryById(id: string) {
    return find(this.anniversaries, (item) => item.id === id)
  }
}

export default new Store()
