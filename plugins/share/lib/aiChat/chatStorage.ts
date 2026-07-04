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
export const DEFAULT_SESSION_ID = 'default'

export abstract class ChatSessionStorage {
  abstract readonly sessionId: string
  abstract load(): Promise<SessionData | undefined>
  abstract save(session: SessionData): Promise<void>
  abstract clear(): Promise<void>
}

export class MemoryChatStorage extends ChatSessionStorage {
  readonly sessionId: string
  private data: SessionData | undefined

  constructor(sessionId = DEFAULT_SESSION_ID) {
    super()
    this.sessionId = sessionId
  }

  async load() {
    return this.data ? jsonClone(this.data) : undefined
  }

  async save(session: SessionData) {
    this.data = jsonClone(session)
  }

  async clear() {
    this.data = undefined
  }
}

export class IndexedDbChatStorage extends ChatSessionStorage {
  readonly sessionId: string
  private dbPromise: Promise<IDBPDatabase<AiChatDB>> | null = null

  constructor(private dbName: string, sessionId = DEFAULT_SESSION_ID) {
    super()
    this.sessionId = sessionId
  }

  private getDB(): Promise<IDBPDatabase<AiChatDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<AiChatDB>(this.dbName, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          }
        },
      })
    }
    return this.dbPromise
  }

  async load() {
    const db = await this.getDB()
    return db.get(STORE_NAME, this.sessionId)
  }

  async save(session: SessionData) {
    const db = await this.getDB()
    await db.put(STORE_NAME, jsonClone(session))
  }

  async clear() {
    const db = await this.getDB()
    await db.delete(STORE_NAME, this.sessionId)
  }
}
