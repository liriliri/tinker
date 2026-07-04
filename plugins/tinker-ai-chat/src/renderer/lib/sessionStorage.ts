import { openDB, DBSchema, IDBPDatabase } from 'idb'
import jsonClone from 'licia/jsonClone'
import type { AgentMessage } from 'share/lib/Agent'
import { ChatSessionStorage } from 'share/lib/aiChat/chatStorage'
import type { SessionData } from 'share/lib/aiChat/types'

export interface AiChatPersistedSession {
  id: string
  title: string
  messages: AgentMessage[]
  systemPrompt: string
  createdAt: number
}

interface AiChatDB extends DBSchema {
  sessions: {
    key: string
    value: AiChatPersistedSession
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

export class AiChatSessionStorage extends ChatSessionStorage {
  readonly sessionId: string
  title = ''

  constructor(sessionId: string) {
    super()
    this.sessionId = sessionId
  }

  async load(): Promise<SessionData | undefined> {
    const db = await getDB()
    const saved = await db.get(STORE_NAME, this.sessionId)
    if (!saved) return undefined

    this.title = saved.title
    return {
      id: saved.id,
      messages: saved.messages,
      createdAt: saved.createdAt,
      systemPrompt: saved.systemPrompt,
    }
  }

  async save(session: SessionData): Promise<void> {
    const db = await getDB()
    await db.put(
      STORE_NAME,
      jsonClone({
        id: session.id,
        title: this.title,
        messages: session.messages,
        systemPrompt: session.systemPrompt ?? '',
        createdAt: session.createdAt,
      })
    )
  }

  async clear(): Promise<void> {
    const db = await getDB()
    await db.delete(STORE_NAME, this.sessionId)
    this.title = ''
  }

  static async getAllSessions(): Promise<AiChatPersistedSession[]> {
    const db = await getDB()
    return db.getAll(STORE_NAME)
  }

  static async removeSession(id: string): Promise<void> {
    const db = await getDB()
    await db.delete(STORE_NAME, id)
  }
}
