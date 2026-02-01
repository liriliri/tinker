import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { CalendarEvent } from '../store'

interface CalendarDB extends DBSchema {
  events: {
    key: string
    value: CalendarEvent
  }
}

const DB_NAME = 'tinker-calendar'
const DB_VERSION = 1
const STORE_NAME = 'events'

let dbPromise: Promise<IDBPDatabase<CalendarDB>> | null = null

function getDB(): Promise<IDBPDatabase<CalendarDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CalendarDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const db = await getDB()
  const events = await db.getAll(STORE_NAME)
  console.log('Events loaded from IndexedDB:', events.length)
  return events
}

export async function addEvent(event: CalendarEvent): Promise<void> {
  const db = await getDB()
  const plainEvent: CalendarEvent = {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
  }
  await db.put(STORE_NAME, plainEvent)
}

export async function updateEvent(event: CalendarEvent): Promise<void> {
  const db = await getDB()
  const plainEvent: CalendarEvent = {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
  }
  await db.put(STORE_NAME, plainEvent)
}

export async function removeEvent(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function clearAllEvents(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}

export async function saveEvents(events: CalendarEvent[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')

  await tx.store.clear()

  for (const event of events) {
    const plainEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
    }
    await tx.store.put(plainEvent)
  }

  await tx.done
  console.log('Events saved to IndexedDB:', events.length)
}
