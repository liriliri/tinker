import { makeAutoObservable } from 'mobx'
import filter from 'licia/filter'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import LocalStore from 'licia/LocalStore'
import sortBy from 'licia/sortBy'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import BaseStore from 'share/BaseStore'
import {
  createDateTime,
  getDatePart,
  getTimePart,
  normalizeDateKey,
} from './lib/date'
import { getHolidaysForYearRange } from './lib/holidays'
import * as db from './lib/db'
import i18n from './i18n'

const storage = new LocalStore('tinker-calendar')
const SIDEBAR_KEY = 'sidebar-open'
const HOLIDAY_COLOR = '#fb923c'

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
}

class Store extends BaseStore {
  selectedDate: string = this.getTodayKey()
  events: CalendarEvent[] = []
  sidebarOpen: boolean = true
  eventDialogOpen: boolean = false
  eventDialogDate: string = ''
  editingEventId: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private getTodayKey() {
    return normalizeDateKey(new Date())
  }

  private extractTime(dateTimeStr: string): string {
    return getTimePart(dateTimeStr)
  }

  private async loadStorage() {
    try {
      const saved = storage.get(SIDEBAR_KEY)
      if (saved !== null && saved !== undefined) {
        this.sidebarOpen = saved as boolean
      }

      const events = await db.getAllEvents()
      this.events = events
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  }

  private saveSidebarState() {
    storage.set(SIDEBAR_KEY, this.sidebarOpen)
  }

  setSelectedDate(value: string | Date) {
    this.selectedDate = normalizeDateKey(value)
  }

  setToday() {
    this.selectedDate = this.getTodayKey()
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    this.saveSidebarState()
  }

  openEventDialog(date: string, eventId?: string) {
    this.eventDialogDate = date
    this.editingEventId = eventId || null
    this.eventDialogOpen = true
  }

  closeEventDialog() {
    this.eventDialogOpen = false
    this.editingEventId = null
  }

  addEvent(
    startDate: string | Date,
    title: string,
    isAllDay = true,
    startTime = '09:00',
    endTime = '10:00',
    endDate?: string
  ) {
    const startDateKey = normalizeDateKey(startDate)
    const endDateKey = endDate ? normalizeDateKey(endDate) : startDateKey
    const newEvent: CalendarEvent = {
      id: uuid(),
      title: trim(title),
      start: createDateTime(startDateKey, isAllDay ? '00:00' : startTime),
      end: isAllDay
        ? endDateKey !== startDateKey
          ? createDateTime(endDateKey, '00:00')
          : undefined
        : endTime
        ? createDateTime(endDateKey, endTime)
        : undefined,
      allDay: isAllDay,
    }

    this.events = [...this.events, newEvent]
    db.addEvent(newEvent)
  }

  updateEvent(
    id: string,
    title: string,
    startDate: string,
    isAllDay: boolean,
    startTime = '09:00',
    endTime = '10:00',
    endDate?: string
  ) {
    const trimmed = trim(title)
    if (!trimmed) return

    const startDateKey = startDate
    const endDateKey = endDate || startDate
    const eventIdx = findIdx(this.events, (event) => event.id === id)
    if (eventIdx === -1) return

    const updatedEvent = {
      ...this.events[eventIdx],
      title: trimmed,
      start: createDateTime(startDateKey, isAllDay ? '00:00' : startTime),
      end: isAllDay
        ? endDateKey !== startDateKey
          ? createDateTime(endDateKey, '00:00')
          : undefined
        : endTime
        ? createDateTime(endDateKey, endTime)
        : undefined,
      allDay: isAllDay,
    }

    this.events = this.events.map((event, idx) =>
      idx === eventIdx ? updatedEvent : event
    )
    db.updateEvent(updatedEvent)
  }

  updateEventDate(id: string, newDate: Date) {
    const dateKey = normalizeDateKey(newDate)
    const eventIdx = findIdx(this.events, (event) => event.id === id)
    if (eventIdx === -1) return

    const event = this.events[eventIdx]
    const startTime = event.allDay ? '00:00' : this.extractTime(event.start)
    const endTime =
      event.end && !event.allDay ? this.extractTime(event.end) : undefined
    const updatedEvent = {
      ...event,
      start: createDateTime(dateKey, startTime),
      end: endTime ? createDateTime(dateKey, endTime) : undefined,
    }

    this.events = this.events.map((event, idx) =>
      idx === eventIdx ? updatedEvent : event
    )
    db.updateEvent(updatedEvent)
  }

  removeEvent(id: string) {
    this.events = filter(this.events, (event) => event.id !== id)
    db.removeEvent(id)
  }

  clearEvents() {
    this.events = []
    db.clearAllEvents()
  }

  clearEventsForDate(date: string | Date) {
    const dateKey = normalizeDateKey(date)
    const toRemove = filter(
      this.events,
      (event) => getDatePart(event.start) === dateKey
    )
    this.events = filter(
      this.events,
      (event) => getDatePart(event.start) !== dateKey
    )
    toRemove.forEach((event) => db.removeEvent(event.id))
  }

  get holidayEvents() {
    const currentYear = new Date().getFullYear()
    const holidays = getHolidaysForYearRange(
      currentYear - 1,
      currentYear + 1,
      i18n.language
    )

    return holidays.map((holiday) => ({
      id: holiday.id,
      title: holiday.nameKey,
      start: createDateTime(holiday.date, '00:00'),
      allDay: true,
      classNames: ['holiday-event'],
      backgroundColor: HOLIDAY_COLOR,
      borderColor: HOLIDAY_COLOR,
      editable: false,
      order: 0,
    }))
  }

  get calendarEvents() {
    const userEvents = this.events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay ?? true,
      order: 1,
    }))

    return [...this.holidayEvents, ...userEvents]
  }

  get eventsForSelectedDate() {
    return sortBy(
      filter(this.events, (event) => {
        const startDate = getDatePart(event.start)
        const endDate = event.end ? getDatePart(event.end) : undefined

        if (!endDate || endDate === startDate) {
          return startDate === this.selectedDate
        }

        return this.selectedDate >= startDate && this.selectedDate <= endDate
      }),
      (event) => {
        if (!event.allDay) {
          return `0-${this.extractTime(event.start)}-${event.title}`
        }
        return `1-99:99-${event.title}`
      }
    )
  }

  getEventById(id: string) {
    return find(this.events, (event) => event.id === id)
  }

  get hasEvents() {
    return this.events.length > 0
  }
}

export default new Store()
