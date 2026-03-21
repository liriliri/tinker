import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { toJS } from 'mobx'
import type { Session } from '../types'

interface AiChatDB extends DBSchema {
  sessions: {
    key: string
    value: Session
  }
}

const DB_NAME = 'tinker-ai-chat'
const DB_VERSION = 1
const STORE_NAME = 'sessions'

let dbPromise: Promise<IDBPDatabase<AiChatDB>> | null = null

function getDB(): Promise<IDBPDatabase<AiChatDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AiChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function putSession(session: Session): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, toJS(session))
}

export async function removeSession(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}
