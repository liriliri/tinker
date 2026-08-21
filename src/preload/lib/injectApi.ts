import type { MenuItemConstructorOptions } from 'electron'
import type types from 'licia/types'
import uuid from 'licia/uuid'

declare const window: any

type KillQuitTask = {
  kill: () => void
  quit: () => void
}

type DownloadTask = {
  pause: () => void
  resume: () => void
  cancel: () => void
  delete: () => void
}

const ffmpegTasks: types.PlainObj<KillQuitTask> = {}
const diskUsageTasks: types.PlainObj<KillQuitTask> = {}
const searchFileTasks: types.PlainObj<KillQuitTask> = {}
const searchTextTasks: types.PlainObj<KillQuitTask> = {}
const downloadTasks: types.PlainObj<DownloadTask> = {}
let contextMenuCallbacks: types.PlainObj<types.AnyFn> = {}

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

function searchFile(query: string, options?: any) {
  const { promise, taskId } = _tinker.searchFile(query, options)

  searchFileTasks[taskId] = {
    kill: () => _tinker.killSearchFile(taskId),
    quit: () => _tinker.quitSearchFile(taskId),
  }

  promise.finally(() => {
    delete searchFileTasks[taskId]
  })

  const extendedPromise = promise as any
  extendedPromise.kill = function () {
    searchFileTasks[taskId]?.kill()
  }
  extendedPromise.quit = function () {
    searchFileTasks[taskId]?.quit()
  }

  return extendedPromise
}

function searchText(query: string, options?: any, onMatch?: any) {
  const { promise, taskId } = _tinker.searchText(query, options, onMatch)

  searchTextTasks[taskId] = {
    kill: () => _tinker.killSearchText(taskId),
    quit: () => _tinker.quitSearchText(taskId),
  }

  promise.finally(() => {
    delete searchTextTasks[taskId]
  })

  const extendedPromise = promise as any
  extendedPromise.kill = function () {
    searchTextTasks[taskId]?.kill()
  }
  extendedPromise.quit = function () {
    searchTextTasks[taskId]?.quit()
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

function wrapDownloadTask(
  dl: any,
  promise: Promise<void>,
  downloadId: string,
  listeners: Set<() => void>
) {
  downloadTasks[downloadId] = {
    pause: () => _tinker.pauseDownload(downloadId),
    resume: () => _tinker.resumeDownload(downloadId),
    cancel: () => _tinker.cancelDownload(downloadId),
    delete: () => _tinker.deleteDownload(downloadId),
  }

  promise.finally(() => {
    delete downloadTasks[downloadId]
  })

  return Object.assign(dl, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
    pause() {
      downloadTasks[downloadId]?.pause()
    },
    resume() {
      downloadTasks[downloadId]?.resume()
    },
    cancel() {
      downloadTasks[downloadId]?.cancel()
    },
    delete() {
      downloadTasks[downloadId]?.delete()
    },
    onProgress(cb: () => void) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
  })
}

function wrapCompletedDownload(dl: any) {
  const resolved =
    dl.state === 'completed'
      ? Promise.resolve()
      : Promise.reject(new Error(`Download ${dl.state}: ${dl.url}`))
  // Silence unhandled rejection for cancelled tasks
  resolved.catch(() => {})

  return Object.assign(dl, {
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
    pause() {},
    resume() {},
    cancel() {},
    delete() {
      _tinker.deleteDownload(dl.id)
    },
    onProgress() {
      return () => {}
    },
  })
}

function attachDownload(dl: any) {
  const listeners = new Set<() => void>()

  const { promise, downloadId } = _tinker.attachDownload(
    dl.id,
    (progress: any) => {
      Object.assign(dl, progress)
      listeners.forEach((cb) => cb())
    }
  )

  return wrapDownloadTask(dl, promise, downloadId, listeners)
}

function download(options: any) {
  const listeners = new Set<() => void>()
  const ref: { task: any } = { task: null }

  const { promise, downloadId } = _tinker.startDownload(
    options,
    (progress: any) => {
      Object.assign(ref.task, progress)
      listeners.forEach((cb) => cb())
    }
  )

  const task = wrapDownloadTask(
    {
      id: downloadId,
      url: options.url,
      state: 'progressing',
      speed: 0,
      totalBytes: 0,
      receivedBytes: 0,
      paused: false,
      savePath: options.savePath,
    },
    promise,
    downloadId,
    listeners
  )
  ref.task = task

  return task
}

async function getDownloads() {
  const list = await _tinker.getDownloads()
  return list.map((dl: any) => {
    if (dl.state === 'completed' || dl.state === 'cancelled') {
      return wrapCompletedDownload(dl)
    }
    return attachDownload(dl)
  })
}

function createTerminal(opts: {
  cols: number
  rows: number
  cwd?: string
  shell?: string
}) {
  const id = uuid()
  let destroyed = false

  _tinker.createTerminal(id, opts.cols, opts.rows, opts.cwd, opts.shell)

  return {
    write(data: string) {
      if (destroyed) return
      _tinker.writeTerminal(id, data)
    },
    resize(cols: number, rows: number) {
      if (destroyed) return
      _tinker.resizeTerminal(id, cols, rows)
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      _tinker.destroyTerminal(id)
    },
    onData(cb: (data: string) => void) {
      _tinker.onTerminalData(id, cb)
    },
    onClose(cb: () => void) {
      _tinker.onTerminalClose(id, cb)
    },
    onInput(cb: () => void) {
      _tinker.onTerminalInput(id, cb)
    },
    getInfo() {
      if (destroyed) return Promise.resolve({ processName: '', cwd: '' })
      return _tinker.getTerminalInfo(id)
    },
  }
}

function formatMcpResult(result: unknown): string {
  if (typeof result === 'string') return result
  return JSON.stringify(result, null, 2)
}

function registerMcp(api: {
  callTool: (
    name: string,
    args: Record<string, unknown>
  ) => unknown | Promise<unknown>
}) {
  window.mcp = {
    async callTool(name: string, args: Record<string, unknown>) {
      return formatMcpResult(await api.callTool(name, args))
    },
  }
}

function transOptions(options: MenuItemConstructorOptions[]) {
  const normalizedOptions = Array.isArray(options) ? options : [options]

  return normalizedOptions.map((option) => {
    const item = { ...option }

    if (typeof item.click === 'function') {
      const id = uuid()
      contextMenuCallbacks[id] = item.click
      ;(item as any).click = id
    }
    if (item.submenu) {
      item.submenu = transOptions(item.submenu as MenuItemConstructorOptions[])
    }

    return item
  })
}

function showContextMenu(
  x: number,
  y: number,
  options: MenuItemConstructorOptions[]
) {
  contextMenuCallbacks = {}
  const transformedOptions = transOptions(options)

  _tinker.showPluginContextMenu(x, y, transformedOptions)
}

function patchWebview() {
  window.addEventListener('DOMContentLoaded', () => {
    const tempWv = document.createElement('webview')
    const webviewProto = Object.getPrototypeOf(tempWv)
    if (webviewProto) {
      webviewProto.sendCommand = function (
        method: string,
        params?: Record<string, unknown>
      ) {
        return _tinker.sendDebuggerCommand(
          this.getWebContentsId(),
          method,
          params
        )
      }
      webviewProto.showDevTools = function (devtoolsWebview: any) {
        return _tinker.showDevTools(
          this.getWebContentsId(),
          devtoolsWebview.getWebContentsId()
        )
      }
    }
  })

  _tinker.on('webviewNewWindow', (webContentsId: number, url: string) => {
    const webviews = document.querySelectorAll('webview')
    for (const wv of webviews) {
      try {
        if ((wv as Electron.WebviewTag).getWebContentsId() === webContentsId) {
          wv.dispatchEvent(Object.assign(new Event('new-window'), { url }))
          break
        }
      } catch {
        // webview not ready
      }
    }
  })
}

export function injectApi() {
  window.tinker = {
    getTheme: _tinker.getTheme,
    getLanguage: _tinker.getLanguage,
    showOpenDialog: _tinker.showOpenDialog,
    showSaveDialog: _tinker.showSaveDialog,
    showItemInPath: _tinker.showItemInPath,
    openExternal: _tinker.openExternal,
    getClipboardFilePaths: _tinker.getClipboardFilePaths,
    captureScreen: _tinker.captureScreen,
    setTitle: _tinker.setTitle,
    readFile: _tinker.readFile,
    writeFile: _tinker.writeFile,
    rm: _tinker.rm,
    fstat: _tinker.fstat,
    getPath: _tinker.getPath,
    getPathForFile: _tinker.getPathForFile,
    getFileIcon: _tinker.getFileIcon,
    showNotification: _tinker.showNotification,
    setBackgroundThrottling: _tinker.setBackgroundThrottling,
    openPlugin: _tinker.openPlugin,
    callMcpTool: _tinker.callMcpTool,
    hasPlugin: _tinker.hasPlugin,
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
    searchFile,
    searchText,
    download,
    getDownloads,
    createTerminal,
    registerMcp,
  }

  patchWebview()

  _tinker.on('clickContextMenu', (id: string) => {
    if (contextMenuCallbacks[id]) {
      contextMenuCallbacks[id]()
    }
  })
}
