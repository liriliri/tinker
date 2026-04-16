import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Sticky } from '../store'

interface StickiesDB extends DBSchema {
  stickies: {
    key: string
    value: Sticky
  }
}

const DB_NAME = 'tinker-stickies'
const DB_VERSION = 1
const STORE_NAME = 'stickies'

let dbPromise: Promise<IDBPDatabase<StickiesDB>> | null = null

function getDB(): Promise<IDBPDatabase<StickiesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StickiesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllStickies(): Promise<Sticky[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function putSticky(sticky: Sticky): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, {
    id: sticky.id,
    content: sticky.content,
    color: sticky.color,
    createdAt: sticky.createdAt,
    updatedAt: sticky.updatedAt,
  })
}

export async function removeSticky(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function saveAllStickies(stickies: Sticky[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')

  await tx.store.clear()

  for (const sticky of stickies) {
    await tx.store.put({
      id: sticky.id,
      content: sticky.content,
      color: sticky.color,
      createdAt: sticky.createdAt,
      updatedAt: sticky.updatedAt,
    })
  }

  await tx.done
}
