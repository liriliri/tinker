import { MenuItemConstructorOptions } from 'electron'
import types from 'licia/types'

declare const window: any

export function injectApi() {
  const ffmpegTasks: types.PlainObj<{
    kill: () => void
    quit: () => void
  }> = {}

  const diskUsageTasks: types.PlainObj<{
    kill: () => void
    quit: () => void
  }> = {}

  function runFFmpeg(args: string[], onProgress?: any) {
    const { promise, taskId } = _tinker.runFFmpeg(args, onProgress)

    ffmpegTasks[taskId] = {
      kill: () => _tinker.killFFmpeg(taskId),
      quit: () => _tinker.quitFFmpeg(taskId),
    }

    promise.finally(() => {
      delete ffmpegTasks[taskId]
    })

    const extendedPromise = promise as any
    extendedPromise.kill = function () {
      ffmpegTasks[taskId]?.kill()
    }
    extendedPromise.quit = function () {
      ffmpegTasks[taskId]?.quit()
    }

    return extendedPromise
  }

  function getDiskUsage(options: any, onProgress?: any) {
    const { promise, taskId } = _tinker.getDiskUsage(options, onProgress)

    diskUsageTasks[taskId] = {
      kill: () => _tinker.killDiskUsage(taskId),
      quit: () => _tinker.quitDiskUsage(taskId),
    }

    promise.finally(() => {
      delete diskUsageTasks[taskId]
    })

    const extendedPromise = promise as any
    extendedPromise.kill = function () {
      diskUsageTasks[taskId]?.kill()
    }
    extendedPromise.quit = function () {
      diskUsageTasks[taskId]?.quit()
    }

    return extendedPromise
  }

  function callAIStream(option: any, onChunk: any) {
    const { promise, requestId } = _tinker.callAIStream(option, onChunk)

    const extendedPromise = promise as any
    extendedPromise.abort = function () {
      _tinker.abortAI(requestId)
    }

    return extendedPromise
  }

  window.tinker = {
    getTheme: _tinker.getTheme,
    getLanguage: _tinker.getLanguage,
    showOpenDialog: _tinker.showOpenDialog,
    showSaveDialog: _tinker.showSaveDialog,
    showItemInPath: _tinker.showItemInPath,
    getClipboardFilePaths: _tinker.getClipboardFilePaths,
    captureScreen: _tinker.captureScreen,
    setTitle: _tinker.setTitle,
    readFile: _tinker.readFile,
    writeFile: _tinker.writeFile,
    rm: _tinker.rm,
    fstat: _tinker.fstat,
    getPath: _tinker.getPath,
    getFileIcon: _tinker.getFileIcon,
    on: _tinker.on,
    runFFmpeg,
    getDiskUsage,
    showContextMenu,
    getMediaInfo: _tinker.getMediaInfo,
    getApps: _tinker.getApps,
    getSetting: _tinker.getSetting,
    setSetting: _tinker.setSetting,
    callAI: _tinker.callAI,
    callAIStream,
    getAIProviders: _tinker.getProviderList,
  }

  function showContextMenu(x, y, options) {
    callbacks = {}
    const transformedOptions = transOptions(options)

    _tinker.showPluginContextMenu(x, y, transformedOptions)
  }

  let callbacks: types.PlainObj<types.AnyFn> = {}

  function transOptions(options: MenuItemConstructorOptions[]) {
    const normalizedOptions = Array.isArray(options) ? options : [options]

    return normalizedOptions.map((option) => {
      const item = { ...option }

      if (typeof item.click === 'function') {
        const id = uuid()
        callbacks[id] = item.click
        ;(item as any).click = id
      }
      if (item.submenu) {
        item.submenu = transOptions(
          item.submenu as MenuItemConstructorOptions[]
        )
      }

      return item
    })
  }

  _tinker.on('clickContextMenu', (id: string) => {
    if (callbacks[id]) {
      callbacks[id]()
    }
  })

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      }
    )
  }
}

export async function importData() {
  const BINARY_TAG = '__tinker_bin__'
  const result = confirm(_tinker.t('importDataConfirm'))
  if (!result) {
    return
  }
  const files = await _tinker.loadData()
  if (!files) return

  // localStorage
  const localStr = files['localStorage.json']
  if (localStr) {
    localStorage.clear()
    const data = JSON.parse(localStr as string)
    for (const key in data) {
      localStorage.setItem(key, data[key])
    }
  }

  // IndexedDB
  const dbNames = new Set<string>()
  for (const name in files) {
    if (name.startsWith('indexedDB/')) {
      const dbName = name.split('/')[1]
      if (dbName) dbNames.add(dbName)
    }
  }

  for (const dbName of dbNames) {
    const metaStr = files[`indexedDB/${dbName}/meta.json`]
    if (!metaStr) continue
    const meta = JSON.parse(metaStr as string)
    const stores = meta.stores || {}

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, meta.version || 1)
      req.onupgradeneeded = () => {
        const upgradeDb = req.result
        for (const storeName in stores) {
          const def = stores[storeName]
          if (!upgradeDb.objectStoreNames.contains(storeName)) {
            upgradeDb.createObjectStore(storeName, {
              keyPath: def.keyPath ?? undefined,
              autoIncrement: !!def.autoIncrement,
            })
          }
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    const storeNames = Array.from(db.objectStoreNames)
    if (storeNames.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, 'readwrite')
        for (const storeName of storeNames) {
          tx.objectStore(storeName).clear()
        }
        tx.oncomplete = () => resolve()
        tx.onerror = tx.onabort = () => reject(tx.error)
      })
    }

    // Import data
    for (const storeName in stores) {
      const dataStr = files[`indexedDB/${dbName}/${storeName}.json`]
      if (!dataStr) continue
      const items = JSON.parse(dataStr as string).map((item: any) => ({
        key: restoreBin(item.key),
        value: restoreBin(item.value),
      }))
      if (items.length === 0) continue

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

  location.reload()

  function restoreBin(value: any): any {
    if (value === null || value === undefined) return value
    if (Array.isArray(value)) {
      return value.map((item) => restoreBin(item))
    }
    if (typeof value === 'object') {
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
      for (const key of Object.keys(value)) {
        result[key] = restoreBin(value[key])
      }
      return result
    }
    return value
  }
}

export async function clearData() {
  const result = confirm(_tinker.t('clearDataConfirm'))
  if (!result) {
    return
  }

  // localStorage
  localStorage.clear()

  // IndexedDB
  const databases = await indexedDB.databases()
  const dbNames: string[] = []
  for (const dbInfo of databases) {
    if (!dbInfo.name) continue
    dbNames.push(dbInfo.name)
    // Clear all store data first
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbInfo.name!)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const storeNames = Array.from(db.objectStoreNames)
    if (storeNames.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, 'readwrite')
        for (const storeName of storeNames) {
          tx.objectStore(storeName).clear()
        }
        tx.oncomplete = () => resolve()
        tx.onerror = tx.onabort = () => reject(tx.error)
      })
    }
    db.close()
  }

  // Try to delete databases, skip if blocked by active connections
  for (const name of dbNames) {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(name)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
  }

  location.reload()
}

export async function exportData(id: string) {
  const BINARY_TAG = '__tinker_bin__'
  const files: Record<string, string | Uint8Array> = {
    'plugin.json': JSON.stringify({ id, date: Date.now() }),
  }

  // localStorage
  const localStorageData: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    localStorageData[key] = localStorage.getItem(key)!
  }
  files['localStorage.json'] = JSON.stringify(localStorageData)

  // IndexedDB
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
    if (storeNames.length > 0) {
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

        const serialized = storeData.map((record) => ({
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

  _tinker.saveData(files)

  function extractBin(value: any): any {
    if (value === null || value === undefined) return value
    if (value instanceof ArrayBuffer) {
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
    if (Array.isArray(value)) {
      return value.map((item: any) => extractBin(item))
    }
    if (typeof value === 'object') {
      const result: any = {}
      for (const key of Object.keys(value)) {
        result[key] = extractBin(value[key])
      }
      return result
    }
    return value
  }
}
