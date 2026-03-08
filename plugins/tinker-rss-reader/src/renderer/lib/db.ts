import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { toJS } from 'mobx'
import type { RSSItem } from '../../common/types'

interface RSSReaderDB extends DBSchema {
  items: {
    key: string
    value: RSSItem
    indexes: { 'by-date': number }
  }
}

const DB_NAME = 'tinker-rss-reader'
const DB_VERSION = 1
const STORE_NAME = 'items'

let dbPromise: Promise<IDBPDatabase<RSSReaderDB>> | null = null

function getDB(): Promise<IDBPDatabase<RSSReaderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RSSReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }
      },
    })
  }
  return dbPromise
}

export async function getAllItems(): Promise<RSSItem[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function addItems(items: RSSItem[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const item of items) {
    await tx.store.put(toJS(item))
  }
  await tx.done
}

export async function putItem(item: RSSItem): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, toJS(item))
}

export async function deleteItemsBySource(sourceId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  let cursor = await tx.store.openCursor()
  while (cursor) {
    if (cursor.value.sourceId === sourceId) await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}
