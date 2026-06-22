import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Photo } from '../types'

interface PhotoDB extends DBSchema {
  photos: {
    key: string
    value: Photo
    indexes: { 'by-createdAt': number; 'by-dateSection': string }
  }
}

const DB_NAME = 'tinker-photo-viewer'
const DB_VERSION = 1
const STORE_NAME = 'photos'

let dbPromise: Promise<IDBPDatabase<PhotoDB>> | null = null

function getDB(): Promise<IDBPDatabase<PhotoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PhotoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('by-createdAt', 'createdAt')
          store.createIndex('by-dateSection', 'dateSection')
        }
      },
    })
  }
  return dbPromise
}

export async function getAllPhotos(): Promise<Photo[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function putPhotos(photos: Photo[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const photo of photos) {
    tx.store.put(photo)
  }
  await tx.done
}

export async function removePhoto(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function clearPhotos(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
