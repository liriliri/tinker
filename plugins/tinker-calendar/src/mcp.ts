import isUndef from 'licia/isUndef'
import trim from 'licia/trim'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { getDatePart, getTimePart } from './lib/date'
import type { CalendarEvent, Store } from './store'
import pkg from '../package.json'

interface ListArgs {
  date?: string
}

interface AddArgs {
  title: string
  date: string
  allDay?: boolean
  startTime?: string
  endTime?: string
  endDate?: string
}

interface UpdateArgs {
  id: string
  title?: string
  date?: string
  allDay?: boolean
  startTime?: string
  endTime?: string
  endDate?: string | null
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list,
    add: addEvent,
    update: updateEvent,
    delete: deleteEvent,
  })
}

function serializeEvent(event: CalendarEvent) {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end ?? null,
    allDay: event.allDay ?? true,
    date: getDatePart(event.start),
    startTime: event.allDay === false ? getTimePart(event.start) : null,
    endTime:
      event.allDay === false && event.end ? getTimePart(event.end) : null,
    endDate: event.end ? getDatePart(event.end) : null,
  }
}

function listEvents(store: Store, date?: string) {
  if (date) {
    store.setSelectedDate(date)
    return {
      selectedDate: store.selectedDate,
      events: store.eventsForSelectedDate.map(serializeEvent),
    }
  }

  return {
    selectedDate: store.selectedDate,
    events: store.events.map(serializeEvent),
  }
}

function list(store: Store, args: ListArgs) {
  return listEvents(store, args.date)
}

function requireEvent(store: Store, id: string): CalendarEvent {
  const event = store.getEventById(id)
  if (!event) {
    throw new Error(`Event with id "${id}" not found.`)
  }
  return event
}

function addEvent(store: Store, args: AddArgs) {
  const title = trim(args.title)
  if (!title) {
    throw new Error('title is required and cannot be empty.')
  }

  const allDay = args.allDay ?? true
  store.addEvent(
    args.date,
    title,
    allDay,
    args.startTime ?? '09:00',
    args.endTime ?? '10:00',
    args.endDate
  )
  store.setSelectedDate(args.date)
  return listEvents(store, args.date)
}

function updateEvent(store: Store, args: UpdateArgs) {
  const existing = requireEvent(store, args.id)
  const title = args.title !== undefined ? trim(args.title) : existing.title
  if (!title) {
    throw new Error('title is required and cannot be empty.')
  }

  const date = args.date ?? getDatePart(existing.start)
  const allDay = args.allDay ?? existing.allDay ?? true
  const startTime =
    args.startTime ??
    (existing.allDay === false ? getTimePart(existing.start) : '09:00')
  const endTime =
    args.endTime ??
    (existing.allDay === false && existing.end
      ? getTimePart(existing.end)
      : '10:00')

  let endDate: string | undefined
  if (args.endDate === null) {
    endDate = undefined
  } else if (!isUndef(args.endDate)) {
    endDate = args.endDate
  } else if (existing.end) {
    endDate = getDatePart(existing.end)
  }

  store.updateEvent(args.id, title, date, allDay, startTime, endTime, endDate)
  store.setSelectedDate(date)
  return listEvents(store, date)
}

function deleteEvent(store: Store, args: { id: string }) {
  const existing = requireEvent(store, args.id)
  const date = getDatePart(existing.start)
  store.removeEvent(args.id)
  store.setSelectedDate(date)
  return listEvents(store, date)
}
