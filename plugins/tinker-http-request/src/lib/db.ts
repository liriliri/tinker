import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Collection } from '../common/types'

interface HttpRequestDB extends DBSchema {
  collections: {
    key: string
    value: Collection
  }
}

const DB_NAME = 'tinker-http-request'
const DB_VERSION = 1
const STORE_NAME = 'collections'

let dbPromise: Promise<IDBPDatabase<HttpRequestDB>> | null = null

function getDB(): Promise<IDBPDatabase<HttpRequestDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HttpRequestDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllCollections(): Promise<Collection[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function saveCollection(collection: Collection): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, collection)
}

export async function removeCollection(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function saveAllCollections(
  collections: Collection[]
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')

  await tx.store.clear()

  for (const collection of collections) {
    await tx.store.put(collection)
  }

  await tx.done
}
