import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { toJS } from 'mobx'
import type { Session } from '../types'

interface AiAssistantDB extends DBSchema {
  session: {
    key: string
    value: Session
  }
}

const DB_NAME = 'tinker-ai-assistant'
const DB_VERSION = 1
const STORE_NAME = 'session'
const SESSION_KEY = 'main'

let dbPromise: Promise<IDBPDatabase<AiAssistantDB>> | null = null

function getDB(): Promise<IDBPDatabase<AiAssistantDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AiAssistantDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

export async function loadSession(): Promise<Session | undefined> {
  const db = await getDB()
  return db.get(STORE_NAME, SESSION_KEY)
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, toJS(session), SESSION_KEY)
}
