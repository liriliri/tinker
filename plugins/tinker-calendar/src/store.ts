import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const storage = new LocalStore('tinker-calendar')
const EVENTS_KEY = 'calendar-events'
const SIDEBAR_KEY = 'sidebar-open'

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  startTime?: string
  endTime?: string
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
    this.loadEvents()
    this.loadSidebarState()
  }

  private getTodayKey() {
    return new Date().toISOString().slice(0, 10)
  }

  private normalizeDateKey(value: string | Date) {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10)
    }
    return value.slice(0, 10)
  }

  private loadEvents() {
    const saved = storage.get(EVENTS_KEY)
    if (saved) {
      this.events = saved as CalendarEvent[]
    }
  }

  private saveEvents() {
    storage.set(EVENTS_KEY, this.events)
  }

  private loadSidebarState() {
    const saved = storage.get(SIDEBAR_KEY)
    if (saved !== null && saved !== undefined) {
      this.sidebarOpen = saved as boolean
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
    startTime?: string,
    endTime?: string,
    endDate?: string
  ) {
    const startDateKey = this.normalizeDateKey(startDate)
    const endDateKey = endDate ? this.normalizeDateKey(endDate) : startDateKey
    const newEvent: CalendarEvent = {
      id: this.createId(),
      title: title.trim(),
      start: isAllDay ? startDateKey : `${startDateKey}T${startTime}`,
      end: isAllDay
        ? endDateKey !== startDateKey
          ? endDateKey
          : undefined
        : endTime
        ? `${endDateKey}T${endTime}`
        : undefined,
      allDay: isAllDay,
      startTime,
      endTime,
    }

    this.events = [...this.events, newEvent]
    this.saveEvents()
  }

  updateEvent(
    id: string,
    title: string,
    startDate: string,
    isAllDay: boolean,
    startTime?: string,
    endTime?: string,
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
        start: isAllDay ? startDateKey : `${startDateKey}T${startTime}`,
        end: isAllDay
          ? endDateKey !== startDateKey
            ? endDateKey
            : undefined
          : endTime
          ? `${endDateKey}T${endTime}`
          : undefined,
        allDay: isAllDay,
        startTime,
        endTime,
      }
    })
    this.saveEvents()
  }

  updateEventTitle(id: string, title: string) {
    const trimmed = title.trim()
    if (!trimmed) return

    this.events = this.events.map((event) =>
      event.id === id ? { ...event, title: trimmed } : event
    )
    this.saveEvents()
  }

  updateEventDate(id: string, newDate: Date) {
    const dateKey = this.normalizeDateKey(newDate)
    this.events = this.events.map((event) => {
      if (event.id !== id) return event

      return {
        ...event,
        start: event.allDay ? dateKey : `${dateKey}T${event.startTime}`,
        end:
          event.allDay || !event.endTime
            ? undefined
            : `${dateKey}T${event.endTime}`,
      }
    })
    this.saveEvents()
  }

  removeEvent(id: string) {
    this.events = this.events.filter((event) => event.id !== id)
    this.saveEvents()
  }

  clearEvents() {
    this.events = []
    this.saveEvents()
  }

  clearEventsForDate(date: string | Date) {
    const dateKey = this.normalizeDateKey(date)
    this.events = this.events.filter(
      (event) => event.start.slice(0, 10) !== dateKey
    )
    this.saveEvents()
  }

  get calendarEvents() {
    return this.events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay ?? true,
    }))
  }

  get eventsForSelectedDate() {
    return this.events
      .filter((event) => event.start.slice(0, 10) === this.selectedDate)
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return 1
        if (!a.allDay && b.allDay) return -1
        if (!a.allDay && !b.allDay && a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime)
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

  private createId() {
    return `event_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`
  }
}

export default new Store()
