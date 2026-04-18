import { ipcMain, session, DownloadItem } from 'electron'
import { IDownloadOptions, IDownloadProgress } from 'common/types'
import { PLUGIN_PARTITION, pluginViews } from './view'
import path from 'path'
import fs from 'fs-extra'
import now from 'licia/now'

interface IPluginDownload {
  id: string
  pluginId: string
  url: string
  fileName: string
  state: string
  speed: number
  totalBytes: number
  receivedBytes: number
  downloadItem: DownloadItem
  paused: boolean
  savePath: string
}

const downloads = new Map<string, IPluginDownload>()

const pendingDownloads = new Map<
  string,
  Array<{
    downloadId: string
    options: IDownloadOptions
  }>
>()

function findPluginId(webContents: Electron.WebContents): string | undefined {
  for (const id in pluginViews) {
    if (pluginViews[id].view.webContents === webContents) {
      return id
    }
  }
}

function serializeDownload(dl: IPluginDownload): IDownloadProgress {
  return {
    state: dl.state,
    speed: dl.speed,
    totalBytes: dl.totalBytes,
    receivedBytes: dl.receivedBytes,
    paused: dl.paused,
  }
}

export function init() {
  const pluginSession = session.fromPartition(PLUGIN_PARTITION)

  pluginSession.on('will-download', (_event, item, webContents) => {
    const pluginId = findPluginId(webContents)
    if (!pluginId) return

    const queue = pendingDownloads.get(pluginId)
    if (!queue || queue.length === 0) return

    const pending = queue.shift()!
    const { downloadId, options } = pending

    const savePath = options.savePath

    item.setSavePath(savePath + '.tinkerdownload')

    const download: IPluginDownload = {
      id: downloadId,
      pluginId,
      url: item.getURL(),
      fileName: path.basename(savePath),
      state: item.getState(),
      speed: 0,
      totalBytes: item.getTotalBytes(),
      receivedBytes: item.getReceivedBytes(),
      downloadItem: item,
      paused: item.isPaused(),
      savePath,
    }
    downloads.set(downloadId, download)

    let prevReceivedBytes = 0
    let prevTime = now()

    item.on('updated', (_e, state) => {
      download.totalBytes = item.getTotalBytes()
      download.receivedBytes = item.getReceivedBytes()
      download.state = state
      download.paused = item.isPaused()

      const time = now()
      if (time - prevTime >= 1000) {
        download.speed = Math.round(
          ((download.receivedBytes - prevReceivedBytes) / (time - prevTime)) *
            1000
        )
        prevTime = time
        prevReceivedBytes = download.receivedBytes
      }

      const view = pluginViews[pluginId]
      if (view) {
        view.view.webContents.send(
          'pluginDownloadProgress',
          downloadId,
          serializeDownload(download)
        )
      }
    })

    item.on('done', async (_e, state) => {
      download.state = state
      download.receivedBytes = item.getReceivedBytes()
      download.speed = 0

      if (state === 'completed') {
        const tmpPath = savePath + '.tinkerdownload'
        try {
          await fs.rename(tmpPath, savePath)
        } catch {
          // ignore
        }
      }

      const view = pluginViews[pluginId]
      if (view) {
        view.view.webContents.send(
          'pluginDownloadDone',
          downloadId,
          serializeDownload(download)
        )
      }
    })
  })

  ipcMain.handle(
    'startPluginDownload',
    (event, downloadId: string, options: IDownloadOptions) => {
      const pluginId = findPluginId(event.sender)
      if (!pluginId) return

      if (!pendingDownloads.has(pluginId)) {
        pendingDownloads.set(pluginId, [])
      }
      pendingDownloads.get(pluginId)!.push({ downloadId, options })

      pluginViews[pluginId].view.webContents.downloadURL(options.url)
    }
  )

  ipcMain.handle('pausePluginDownload', (event, downloadId: string) => {
    const pluginId = findPluginId(event.sender)
    const dl = downloads.get(downloadId)
    if (dl && dl.pluginId === pluginId) {
      dl.downloadItem.pause()
    }
  })

  ipcMain.handle('resumePluginDownload', (event, downloadId: string) => {
    const pluginId = findPluginId(event.sender)
    const dl = downloads.get(downloadId)
    if (dl && dl.pluginId === pluginId) {
      dl.downloadItem.resume()
    }
  })

  ipcMain.handle('cancelPluginDownload', (event, downloadId: string) => {
    const pluginId = findPluginId(event.sender)
    const dl = downloads.get(downloadId)
    if (dl && dl.pluginId === pluginId) {
      dl.downloadItem.cancel()
    }
  })

  ipcMain.handle('deletePluginDownload', (event, downloadId: string) => {
    const pluginId = findPluginId(event.sender)
    const dl = downloads.get(downloadId)
    if (dl && dl.pluginId === pluginId) {
      if (dl.state !== 'completed' && dl.state !== 'cancelled') {
        dl.downloadItem.cancel()
      }
      downloads.delete(downloadId)
    }
  })

  ipcMain.handle('getPluginDownloads', (event) => {
    const pluginId = findPluginId(event.sender)
    if (!pluginId) return []

    const result: (IDownloadProgress & {
      id: string
      url: string
      savePath: string
    })[] = []
    for (const [, dl] of downloads) {
      if (dl.pluginId === pluginId) {
        result.push({
          id: dl.id,
          url: dl.url,
          savePath: dl.savePath,
          ...serializeDownload(dl),
        })
      }
    }
    return result
  })
}
