import { ipcRenderer } from 'electron'
import uuid from 'licia/uuid'
import { IDownloadOptions, IDownloadProgress } from 'common/types'

type ProgressCallback = (progress: IDownloadProgress) => void

interface PendingDownload {
  onProgress?: ProgressCallback
  resolve: () => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

const pendingCallbacks = new Map<string, PendingDownload>()

ipcRenderer.on(
  'pluginDownloadProgress',
  (_event, downloadId: string, progress: IDownloadProgress) => {
    const pending = pendingCallbacks.get(downloadId)
    if (!pending) return

    clearTimeout(pending.timeout)

    if (pending.onProgress) {
      pending.onProgress(progress)
    }
  }
)

ipcRenderer.on(
  'pluginDownloadDone',
  (_event, downloadId: string, result: IDownloadProgress) => {
    const pending = pendingCallbacks.get(downloadId)
    if (!pending) return

    clearTimeout(pending.timeout)

    if (pending.onProgress) {
      pending.onProgress(result)
    }

    if (result.state === 'completed') {
      pending.resolve()
    } else {
      pending.reject(new Error(`Download ${result.state}`))
    }
    pendingCallbacks.delete(downloadId)
  }
)

export function startDownload(
  options: IDownloadOptions,
  onProgress?: ProgressCallback
): { promise: Promise<void>; downloadId: string } {
  const downloadId = uuid()

  const promise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingCallbacks.has(downloadId)) {
        pendingCallbacks.delete(downloadId)
        reject(new Error('Download failed to start'))
      }
    }, 30000)

    pendingCallbacks.set(downloadId, { onProgress, resolve, reject, timeout })
    ipcRenderer.invoke('startPluginDownload', downloadId, options).catch(reject)
  })

  return { promise, downloadId }
}

export function pauseDownload(downloadId: string): void {
  ipcRenderer.invoke('pausePluginDownload', downloadId)
}

export function resumeDownload(downloadId: string): void {
  ipcRenderer.invoke('resumePluginDownload', downloadId)
}

export function cancelDownload(downloadId: string): void {
  ipcRenderer.invoke('cancelPluginDownload', downloadId)
  const pending = pendingCallbacks.get(downloadId)
  if (pending) {
    clearTimeout(pending.timeout)
    if (pending.onProgress) {
      pending.onProgress({ state: 'cancelled' } as IDownloadProgress)
    }
    pending.reject(new Error('Download cancelled'))
    pendingCallbacks.delete(downloadId)
  }
}

export function deleteDownload(downloadId: string): void {
  ipcRenderer.invoke('deletePluginDownload', downloadId)
  const pending = pendingCallbacks.get(downloadId)
  if (pending) {
    clearTimeout(pending.timeout)
    if (pending.onProgress) {
      pending.onProgress({ state: 'cancelled' } as IDownloadProgress)
    }
    pending.reject(new Error('Download deleted'))
    pendingCallbacks.delete(downloadId)
  }
}

export async function getDownloads(): Promise<IDownloadProgress[]> {
  return ipcRenderer.invoke('getPluginDownloads')
}

export function attachDownload(
  downloadId: string,
  onProgress?: ProgressCallback
): { promise: Promise<void>; downloadId: string } {
  const promise = new Promise<void>((resolve, reject) => {
    pendingCallbacks.set(downloadId, {
      onProgress,
      resolve,
      reject,
      timeout: 0 as unknown as ReturnType<typeof setTimeout>,
    })
  })

  return { promise, downloadId }
}
