import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { ClipboardItem } from '../store'

interface ClipboardDB extends DBSchema {
  items: {
    key: string
    value: ClipboardItem
    indexes: { 'by-timestamp': number }
  }
}

const DB_NAME = 'tinker-clipboard'
const DB_VERSION = 1
const STORE_NAME = 'items'

let dbPromise: Promise<IDBPDatabase<ClipboardDB>> | null = null

function getDB(): Promise<IDBPDatabase<ClipboardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ClipboardDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('by-timestamp', 'timestamp')
        }
      },
    })
  }
  return dbPromise
}

export async function getAllItems(): Promise<ClipboardItem[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function saveItems(items: ClipboardItem[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')

  // Clear existing items
  await tx.store.clear()

  // Add all items
  for (const item of items) {
    await tx.store.put(item)
  }

  await tx.done
}

export async function addItem(item: ClipboardItem): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, item)
}

export async function removeItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function clearAll(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
