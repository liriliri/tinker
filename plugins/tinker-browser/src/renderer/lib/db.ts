import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface FaviconEntry {
  id: string
  data: string
}

interface BrowserDB extends DBSchema {
  favicons: {
    key: string
    value: FaviconEntry
  }
}

const DB_NAME = 'tinker-browser'
const DB_VERSION = 1
const STORE_NAME = 'favicons'

let dbPromise: Promise<IDBPDatabase<BrowserDB>> | null = null

function getDB(): Promise<IDBPDatabase<BrowserDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BrowserDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getFavicon(id: string): Promise<string> {
  const db = await getDB()
  const entry = await db.get(STORE_NAME, id)
  return entry?.data || ''
}

export async function getAllFavicons(): Promise<Map<string, string>> {
  const db = await getDB()
  const entries = await db.getAll(STORE_NAME)
  const map = new Map<string, string>()
  for (const entry of entries) {
    map.set(entry.id, entry.data)
  }
  return map
}

export async function saveFavicon(id: string, data: string): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, { id, data })
}

export async function removeFavicon(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}
