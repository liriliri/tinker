import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Anniversary } from '../types'

interface AnniversaryDB extends DBSchema {
  anniversaries: {
    key: string
    value: Anniversary
  }
}

const DB_NAME = 'tinker-anniversary'
const DB_VERSION = 1
const STORE_NAME = 'anniversaries'

let dbPromise: Promise<IDBPDatabase<AnniversaryDB>> | null = null

function getDB(): Promise<IDBPDatabase<AnniversaryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AnniversaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllAnniversaries(): Promise<Anniversary[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function addAnniversary(anniversary: Anniversary): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, anniversary)
}

export async function updateAnniversary(
  anniversary: Anniversary
): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, anniversary)
}

export async function removeAnniversary(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}
