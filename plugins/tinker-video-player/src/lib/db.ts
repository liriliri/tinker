import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { HistoryItem } from '../types'

interface VideoDB extends DBSchema {
  history: {
    key: string
    value: HistoryItem
  }
}

const DB_NAME = 'tinker-video-player'
const DB_VERSION = 1
const STORE_NAME = 'history'

let dbPromise: Promise<IDBPDatabase<VideoDB>> | null = null

function getDB(): Promise<IDBPDatabase<VideoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VideoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'filePath' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllHistory(): Promise<HistoryItem[]> {
  const db = await getDB()
  const items = await db.getAll(STORE_NAME)
  return items.sort((a, b) => b.lastPlayed - a.lastPlayed)
}

export async function putHistory(item: HistoryItem): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, item)
}

export async function removeHistory(filePath: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, filePath)
}

export async function clearHistory(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
