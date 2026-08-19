import delay from 'licia/delay'
import each from 'licia/each'
import isArr from 'licia/isArr'
import isArrBuffer from 'licia/isArrBuffer'
import isEmpty from 'licia/isEmpty'
import isNil from 'licia/isNil'
import isObj from 'licia/isObj'
import keys from 'licia/keys'
import map from 'licia/map'
import now from 'licia/now'
import startWith from 'licia/startWith'

const BINARY_TAG = '__tinker_bin__'

function reloadSoon() {
  delay(() => location.reload(), 0)
}

export async function importData(filePath?: string) {
  if (!filePath) {
    const result = confirm(_tinker.t('importDataConfirm'))
    if (!result) {
      return
    }
  }
  const files = await _tinker.loadData(filePath)
  if (!files) return

  // localStorage
  const localStr = files['localStorage.json']
  if (localStr) {
    localStorage.clear()
    each(JSON.parse(localStr as string), (val: string, key: string) => {
      localStorage.setItem(key, val)
    })
  }

  const dbNames = new Set<string>()
  each(files, (_val, name) => {
    if (startWith(name, 'indexedDB/')) {
      const dbName = name.split('/')[1]
      if (dbName) dbNames.add(dbName)
    }
  })

  for (const dbName of dbNames) {
    const metaStr = files[`indexedDB/${dbName}/meta.json`]
    if (!metaStr) continue
    const meta = JSON.parse(metaStr as string)
    const stores = meta.stores || {}

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, meta.version || 1)
      req.onupgradeneeded = () => {
        const upgradeDb = req.result
        each(stores, (def: any, storeName: string) => {
          if (!upgradeDb.objectStoreNames.contains(storeName)) {
            upgradeDb.createObjectStore(storeName, {
              keyPath: def.keyPath ?? undefined,
              autoIncrement: !!def.autoIncrement,
            })
          }
        })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    const storeNames = Array.from(db.objectStoreNames)
    if (!isEmpty(storeNames)) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, 'readwrite')
        each(storeNames, (storeName) => {
          tx.objectStore(storeName).clear()
        })
        tx.oncomplete = () => resolve()
        tx.onerror = tx.onabort = () => reject(tx.error)
      })
    }

    for (const storeName in stores) {
      const dataStr = files[`indexedDB/${dbName}/${storeName}.json`]
      if (!dataStr) continue
      const items = map(JSON.parse(dataStr as string), (item: any) => ({
        key: restoreBin(item.key),
        value: restoreBin(item.value),
      }))
      if (isEmpty(items)) continue

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite')
        const store = tx.objectStore(storeName)
        for (const item of items) {
          if (store.keyPath) {
            store.put(item.value)
          } else {
            store.put(item.value, item.key)
          }
        }
        tx.oncomplete = () => resolve()
        tx.onerror = tx.onabort = () => reject(tx.error)
      })
    }

    db.close()
  }

  reloadSoon()

  function restoreBin(value: any): any {
    if (isNil(value)) return value
    if (isArr(value)) {
      return map(value, (item) => restoreBin(item))
    }
    if (isObj(value)) {
      if (value[BINARY_TAG]) {
        const bytes = files![value.path] as Uint8Array
        if (!bytes) return null

        const type = value[BINARY_TAG]
        if (type === 'ArrayBuffer') return bytes.buffer
        const TypedArrayMap: any = {
          Uint8Array,
          Int8Array,
          Uint16Array,
          Int16Array,
          Uint32Array,
          Int32Array,
          Float32Array,
          Float64Array,
        }
        const Ctor = TypedArrayMap[type]
        return Ctor ? new Ctor(bytes.buffer) : bytes.buffer
      }
      const result: any = {}
      each(keys(value), (key) => {
        result[key] = restoreBin(value[key])
      })
      return result
    }
    return value
  }
}

export async function clearData(force?: boolean) {
  if (!force) {
    const result = confirm(_tinker.t('clearDataConfirm'))
    if (!result) {
      return
    }
  }

  localStorage.clear()

  const databases = await indexedDB.databases()
  const dbNames: string[] = []
  for (const dbInfo of databases) {
    if (!dbInfo.name) continue
    dbNames.push(dbInfo.name)
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbInfo.name!)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const storeNames = Array.from(db.objectStoreNames)
    if (!isEmpty(storeNames)) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, 'readwrite')
        each(storeNames, (storeName) => {
          tx.objectStore(storeName).clear()
        })
        tx.oncomplete = () => resolve()
        tx.onerror = tx.onabort = () => reject(tx.error)
      })
    }
    db.close()
  }

  for (const name of dbNames) {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(name)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
  }

  reloadSoon()
}

export async function exportData(id: string, filePath?: string) {
  const files: Record<string, string | Uint8Array> = {
    'plugin.json': JSON.stringify({ id, date: now() }),
  }

  const localStorageData: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    localStorageData[key] = localStorage.getItem(key)!
  }
  files['localStorage.json'] = JSON.stringify(localStorageData)

  let binIdx = 0
  const databases = await indexedDB.databases()
  for (const dbInfo of databases) {
    if (!dbInfo.name) continue
    const dbName = dbInfo.name

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    const meta = {
      version: db.version,
      stores: {} as Record<string, any>,
    }

    const storeNames = Array.from(db.objectStoreNames)
    if (!isEmpty(storeNames)) {
      const tx = db.transaction(storeNames, 'readonly')

      for (let i = 0, len = storeNames.length; i < len; i++) {
        const storeName = storeNames[i]
        const store = tx.objectStore(storeName)

        meta.stores[storeName] = {
          keyPath: store.keyPath,
          autoIncrement: store.autoIncrement,
        }

        const storeData = await new Promise<{ key: any; value: any }[]>(
          (resolve, reject) => {
            const items: { key: any; value: any }[] = []
            const req = store.openCursor()
            req.onsuccess = () => {
              const cursor = req.result
              if (cursor) {
                items.push({ key: cursor.key, value: cursor.value })
                cursor.continue()
              } else {
                resolve(items)
              }
            }
            req.onerror = () => reject(req.error)
          }
        )

        const serialized = map(storeData, (record) => ({
          key: extractBin(record.key),
          value: extractBin(record.value),
        }))

        files[`indexedDB/${dbName}/${storeName}.json`] =
          JSON.stringify(serialized)
      }
    }

    files[`indexedDB/${dbName}/meta.json`] = JSON.stringify(meta)
    db.close()
  }

  return _tinker.saveData(files, filePath)

  function extractBin(value: any): any {
    if (isNil(value)) return value
    if (isArrBuffer(value)) {
      const binPath = `bin/${binIdx++}.bin`
      files[binPath] = new Uint8Array(value)
      return { [BINARY_TAG]: 'ArrayBuffer', path: binPath }
    }
    if (ArrayBuffer.isView(value)) {
      const binPath = `bin/${binIdx++}.bin`
      files[binPath] = new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
      )
      return { [BINARY_TAG]: value.constructor.name, path: binPath }
    }
    if (isArr(value)) {
      return map(value, (item: any) => extractBin(item))
    }
    if (isObj(value)) {
      const result: any = {}
      each(keys(value), (key) => {
        result[key] = extractBin(value[key])
      })
      return result
    }
    return value
  }
}
