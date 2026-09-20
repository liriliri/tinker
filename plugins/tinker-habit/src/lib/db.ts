import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { CheckIn, Habit } from '../types'

interface HabitDB extends DBSchema {
  habits: {
    key: string
    value: Habit
  }
  checkIns: {
    key: string
    value: CheckIn
    indexes: { 'by-habit': string; 'by-date': string }
  }
}

const DB_NAME = 'tinker-habit'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<HabitDB>> | null = null

function getDB(): Promise<IDBPDatabase<HabitDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HabitDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('checkIns')) {
          const store = db.createObjectStore('checkIns', { keyPath: 'id' })
          store.createIndex('by-habit', 'habitId')
          store.createIndex('by-date', 'date')
        }
      },
    })
  }
  return dbPromise
}

export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDB()
  return db.getAll('habits')
}

export async function putHabit(habit: Habit): Promise<void> {
  const db = await getDB()
  await db.put('habits', habit)
}

export async function removeHabit(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['habits', 'checkIns'], 'readwrite')
  await tx.objectStore('habits').delete(id)
  const index = tx.objectStore('checkIns').index('by-habit')
  let cursor = await index.openCursor(id)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}

export async function getAllCheckIns(): Promise<CheckIn[]> {
  const db = await getDB()
  return db.getAll('checkIns')
}

export async function putCheckIn(checkIn: CheckIn): Promise<void> {
  const db = await getDB()
  await db.put('checkIns', checkIn)
}

export async function removeCheckIn(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('checkIns', id)
}
