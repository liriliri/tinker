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

export interface RecentTrack extends Track {
  playedAt: number
}

export interface MusicSheet {
  id: string
  title: string
  trackIds: string[]
  createdAt: number
}

interface MusicDB extends DBSchema {
  tracks: {
    key: string
    value: Track
  }
  recentTracks: {
    key: string
    value: RecentTrack
    indexes: { 'by-playedAt': number }
  }
  sheets: {
    key: string
    value: MusicSheet
  }
}

const DB_NAME = 'tinker-music-player'
const DB_VERSION = 3
const STORE_NAME = 'tracks'
const RECENT_STORE = 'recentTracks'
const SHEETS_STORE = 'sheets'

let dbPromise: Promise<IDBPDatabase<MusicDB>> | null = null

function getDB(): Promise<IDBPDatabase<MusicDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MusicDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(RECENT_STORE)) {
          const store = db.createObjectStore(RECENT_STORE, { keyPath: 'id' })
          store.createIndex('by-playedAt', 'playedAt')
        }
        if (!db.objectStoreNames.contains(SHEETS_STORE)) {
          db.createObjectStore(SHEETS_STORE, { keyPath: 'id' })
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

const MAX_RECENT = 100

export async function addRecentTrack(track: Track): Promise<void> {
  const db = await getDB()
  const recentTrack: RecentTrack = { ...track, playedAt: Date.now() }
  await db.put(RECENT_STORE, recentTrack)

  const all = await db.getAllFromIndex(RECENT_STORE, 'by-playedAt')
  if (all.length > MAX_RECENT) {
    const tx = db.transaction(RECENT_STORE, 'readwrite')
    const toRemove = all.slice(0, all.length - MAX_RECENT)
    for (const item of toRemove) {
      tx.store.delete(item.id)
    }
    await tx.done
  }
}

export async function getRecentTracks(): Promise<RecentTrack[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex(RECENT_STORE, 'by-playedAt')
  return all.reverse()
}

// Sheet operations

export async function getAllSheets(): Promise<MusicSheet[]> {
  const db = await getDB()
  return db.getAll(SHEETS_STORE)
}

export async function putSheet(sheet: MusicSheet): Promise<void> {
  const db = await getDB()
  await db.put(SHEETS_STORE, sheet)
}

export async function removeSheet(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(SHEETS_STORE, id)
}
