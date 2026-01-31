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
}

class Store extends BaseStore {
  selectedDate: string = this.getTodayKey()
  events: CalendarEvent[] = []
  sidebarOpen: boolean = true

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

  addEvent(date: string | Date, title: string) {
    const newEvent: CalendarEvent = {
      id: this.createId(),
      title: title.trim(),
      start: this.normalizeDateKey(date),
      allDay: true,
    }

    this.events = [...this.events, newEvent]
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
    this.events = this.events.map((event) =>
      event.id === id ? { ...event, start: dateKey } : event
    )
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

  get eventsForSelectedDate() {
    return this.events
      .filter((event) => event.start.slice(0, 10) === this.selectedDate)
      .sort((a, b) => a.title.localeCompare(b.title))
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
