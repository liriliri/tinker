import { MenuItemConstructorOptions } from 'electron'
import types from 'licia/types'

declare const window: any

export function injectApi() {
  const ffmpegTasks: types.PlainObj<{
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
    fstat: _tinker.fstat,
    tmpdir: _tinker.tmpdir,
    getFileIcon: _tinker.getFileIcon,
    on: _tinker.on,
    runFFmpeg,
    showContextMenu,
    getMediaInfo: _tinker.getMediaInfo,
  }

  function showContextMenu(x, y, options) {
    callbacks = {}
    transOptions(options)

    _tinker.showPluginContextMenu(x, y, options)
  }

  let callbacks: types.PlainObj<types.AnyFn> = {}

  function transOptions(options: MenuItemConstructorOptions[]) {
    options = Array.isArray(options) ? options : [options]
    options.forEach((item) => {
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
    })
    return options
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
  const files = await _tinker.loadData()
  if (!files) return

  // localStorage
  const localStr = files['localStorage.json']
  if (localStr) {
    localStorage.clear()
    const data = JSON.parse(localStr)
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
    const meta = JSON.parse(metaStr)
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
      const items = JSON.parse(dataStr)
      if (items.length === 0) continue

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite')
        const store = tx.objectStore(storeName)
        for (const item of items) {
          store.put(item)
        }
        tx.oncomplete = () => resolve()
        tx.onerror = tx.onabort = () => reject(tx.error)
      })
    }

    db.close()
  }

  location.reload()
}

export async function exportData(id: string) {
  const files: types.PlainObj<string> = {
    'plugin.json': JSON.stringify({ id, date: Date.now() }),
  }

  // localStorage
  const localStorageData: types.PlainObj<string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    localStorageData[key] = localStorage.getItem(key)!
  }
  files['localStorage.json'] = JSON.stringify(localStorageData)

  // IndexedDB
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
      stores: {} as types.PlainObj<any>,
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

        const storeData = await new Promise<any[]>((resolve, reject) => {
          const req = store.getAll()
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
        })

        files[`indexedDB/${dbName}/${storeName}.json`] =
          JSON.stringify(storeData)
      }
    }

    files[`indexedDB/${dbName}/meta.json`] = JSON.stringify(meta)

    db.close()
  }

  _tinker.saveData(files)
}
