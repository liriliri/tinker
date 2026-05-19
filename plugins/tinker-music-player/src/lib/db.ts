import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  cover?: string
  path: string
}

interface MusicDB extends DBSchema {
  tracks: {
    key: string
    value: Track
  }
}

const DB_NAME = 'tinker-music-player'
const DB_VERSION = 1
const STORE_NAME = 'tracks'

let dbPromise: Promise<IDBPDatabase<MusicDB>> | null = null

function getDB(): Promise<IDBPDatabase<MusicDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MusicDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function putTracks(tracks: Track[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const track of tracks) {
    tx.store.put(track)
  }
  await tx.done
}

export async function removeTrack(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}
