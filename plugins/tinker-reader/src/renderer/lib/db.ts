import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { toJS } from 'mobx'
import type { Book } from '../types'

interface BookDB extends DBSchema {
  books: {
    key: string
    value: Book
    indexes: { 'by-lastOpenedAt': number }
  }
}

const DB_NAME = 'tinker-reader'
const DB_VERSION = 1
const STORE_NAME = 'books'

let dbPromise: Promise<IDBPDatabase<BookDB>> | null = null

function getDB(): Promise<IDBPDatabase<BookDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BookDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('by-lastOpenedAt', 'lastOpenedAt')
        }
      },
    })
  }
  return dbPromise
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function putBooks(books: Book[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const book of books) {
    tx.store.put(toJS(book) as Book)
  }
  await tx.done
}

export async function removeBook(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function clearBooks(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
