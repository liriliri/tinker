import { openDB, DBSchema, IDBPDatabase } from 'idb'
import jsonClone from 'licia/jsonClone'
import type { SessionData } from '../types/chat'

interface RegexpChatDB extends DBSchema {
  sessions: {
    key: string
    value: SessionData
  }
}

const DB_NAME = 'tinker-regexp'
const DB_VERSION = 1
const STORE_NAME = 'sessions'
export const SESSION_ID = 'default'

let dbPromise: Promise<IDBPDatabase<RegexpChatDB>> | null = null

function getDB(): Promise<IDBPDatabase<RegexpChatDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RegexpChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getSession(): Promise<SessionData | undefined> {
  const db = await getDB()
  return db.get(STORE_NAME, SESSION_ID)
}

export async function putSession(session: SessionData): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, jsonClone(session))
}

export async function removeSession(): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, SESSION_ID)
}
