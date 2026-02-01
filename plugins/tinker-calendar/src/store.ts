import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import BaseStore from 'share/BaseStore'
import { getHolidaysForYearRange } from './lib/holidays'
import * as db from './lib/db'

const storage = new LocalStore('tinker-calendar')
const SIDEBAR_KEY = 'sidebar-open'

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
    this.loadFromStorage()
  }

  private getTodayKey() {
    return this.normalizeDateKey(new Date())
  }

  private normalizeDateKey(value: string | Date) {
    if (value instanceof Date) {
      const year = value.getFullYear()
      const month = String(value.getMonth() + 1).padStart(2, '0')
      const day = String(value.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return value.slice(0, 10)
  }

  private extractTime(dateTimeStr: string): string {
    return dateTimeStr.slice(11, 16)
  }

  private async loadFromStorage() {
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
    this.selectedDate = this.normalizeDateKey(value)
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
    const startDateKey = this.normalizeDateKey(startDate)
    const endDateKey = endDate ? this.normalizeDateKey(endDate) : startDateKey
    const newEvent: CalendarEvent = {
      id: uuid(),
      title: title.trim(),
      start: isAllDay
        ? `${startDateKey}T00:00`
        : `${startDateKey}T${startTime}`,
      end: isAllDay
        ? endDateKey !== startDateKey
          ? `${endDateKey}T00:00`
          : undefined
        : endTime
        ? `${endDateKey}T${endTime}`
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
    const trimmed = title.trim()
    if (!trimmed) return

    const startDateKey = startDate
    const endDateKey = endDate || startDate

    this.events = this.events.map((event) => {
      if (event.id !== id) return event

      return {
        ...event,
        title: trimmed,
        start: isAllDay
          ? `${startDateKey}T00:00`
          : `${startDateKey}T${startTime}`,
        end: isAllDay
          ? endDateKey !== startDateKey
            ? `${endDateKey}T00:00`
            : undefined
          : endTime
          ? `${endDateKey}T${endTime}`
          : undefined,
        allDay: isAllDay,
      }
    })
    const updatedEvent = this.events.find((e) => e.id === id)
    if (updatedEvent) {
      db.updateEvent(updatedEvent)
    }
  }

  updateEventDate(id: string, newDate: Date) {
    const dateKey = this.normalizeDateKey(newDate)
    this.events = this.events.map((event) => {
      if (event.id !== id) return event

      const startTime = event.allDay ? '00:00' : this.extractTime(event.start)
      const endTime =
        event.end && !event.allDay ? this.extractTime(event.end) : undefined

      return {
        ...event,
        start: `${dateKey}T${startTime}`,
        end: endTime ? `${dateKey}T${endTime}` : undefined,
      }
    })
    const updatedEvent = this.events.find((e) => e.id === id)
    if (updatedEvent) {
      db.updateEvent(updatedEvent)
    }
  }

  removeEvent(id: string) {
    this.events = this.events.filter((event) => event.id !== id)
    db.removeEvent(id)
  }

  clearEvents() {
    this.events = []
    db.clearAllEvents()
  }

  clearEventsForDate(date: string | Date) {
    const dateKey = this.normalizeDateKey(date)
    const toRemove = this.events.filter(
      (event) => event.start.slice(0, 10) === dateKey
    )
    this.events = this.events.filter(
      (event) => event.start.slice(0, 10) !== dateKey
    )
    toRemove.forEach((event) => db.removeEvent(event.id))
  }

  get holidayEvents() {
    const currentYear = new Date().getFullYear()
    const holidays = getHolidaysForYearRange(currentYear - 1, currentYear + 1)

    return holidays.map((holiday) => ({
      id: holiday.id,
      title: holiday.nameKey,
      start: `${holiday.date}T00:00`,
      allDay: true,
      classNames: ['holiday-event'],
      backgroundColor: '#fb923c',
      borderColor: '#fb923c',
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
    return this.events
      .filter((event) => {
        const startDate = event.start.slice(0, 10)
        const endDate = event.end?.slice(0, 10)

        if (!endDate || endDate === startDate) {
          return startDate === this.selectedDate
        }

        return this.selectedDate >= startDate && this.selectedDate <= endDate
      })
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return 1
        if (!a.allDay && b.allDay) return -1
        if (!a.allDay && !b.allDay) {
          const aTime = this.extractTime(a.start)
          const bTime = this.extractTime(b.start)
          return aTime.localeCompare(bTime)
        }
        return a.title.localeCompare(b.title)
      })
  }

  getEventById(id: string) {
    return this.events.find((event) => event.id === id)
  }

  get hasEvents() {
    return this.events.length > 0
  }
}

export default new Store()
