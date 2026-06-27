import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { ISftpSessionConfig } from '../../common/types'

export interface ISessionFolder {
  id: string
  name: string
  order: number
  children: ISftpSessionConfig[]
}

interface SftpDB extends DBSchema {
  sessions: {
    key: string
    value: ISessionFolder
  }
}

const DB_NAME = 'tinker-sftp'
const DB_VERSION = 1
const STORE_NAME = 'sessions'

let dbPromise: Promise<IDBPDatabase<SftpDB>> | null = null

function getDB(): Promise<IDBPDatabase<SftpDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SftpDB>(DB_NAME, DB_VERSION, {
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
  const folders = await db.getAll(STORE_NAME)
  return folders.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function putFolder(folder: ISessionFolder): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, folder)
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}
