import { openDB, DBSchema, IDBPDatabase } from 'idb'
import jsonClone from 'licia/jsonClone'
import type { SessionData } from './types'

interface AiChatDB extends DBSchema {
  sessions: {
    key: string
    value: SessionData
  }
}

const DB_VERSION = 1
const STORE_NAME = 'sessions'
const SESSION_ID = 'default'

export interface ChatDbApi {
  SESSION_ID: string
  getSession: () => Promise<SessionData | undefined>
  putSession: (session: SessionData) => Promise<void>
  removeSession: () => Promise<void>
}

export function createChatDb(dbName: string): ChatDbApi {
  let dbPromise: Promise<IDBPDatabase<AiChatDB>> | null = null

  function getDB(): Promise<IDBPDatabase<AiChatDB>> {
    if (!dbPromise) {
      dbPromise = openDB<AiChatDB>(dbName, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          }
        },
      })
    }
    return dbPromise
  }

  return {
    SESSION_ID,
    async getSession() {
      const db = await getDB()
      return db.get(STORE_NAME, SESSION_ID)
    },
    async putSession(session: SessionData) {
      const db = await getDB()
      await db.put(STORE_NAME, jsonClone(session))
    },
    async removeSession() {
      const db = await getDB()
      await db.delete(STORE_NAME, SESSION_ID)
    },
  }
}
