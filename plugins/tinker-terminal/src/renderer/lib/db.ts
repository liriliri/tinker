import { openDB, DBSchema, IDBPDatabase } from 'idb'

export type SessionType = 'local' | 'ssh'
export type SSHAuthType = 'none' | 'password' | 'privateKey'

export interface ISessionConfig {
  id: string
  name: string
  type: SessionType
  shell?: string
  cwd?: string
  // SSH fields
  host?: string
  port?: number
  username?: string
  authType?: SSHAuthType
  password?: string
  privateKey?: string
}

export interface ISessionFolder {
  id: string
  name: string
  children: ISessionConfig[]
}

interface TerminalDB extends DBSchema {
  sessions: {
    key: string
    value: ISessionFolder
  }
}

const DB_NAME = 'tinker-terminal'
const DB_VERSION = 1
const STORE_NAME = 'sessions'

let dbPromise: Promise<IDBPDatabase<TerminalDB>> | null = null

function getDB(): Promise<IDBPDatabase<TerminalDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TerminalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllFolders(): Promise<ISessionFolder[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function putFolder(folder: ISessionFolder): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, folder)
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function saveAllFolders(folders: ISessionFolder[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  await tx.store.clear()
  for (const folder of folders) {
    await tx.store.put(folder)
  }
  await tx.done
}
