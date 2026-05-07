import { IpcGetFileIcon } from 'common/types'
import { handleEvent } from 'share/main/lib/util'
import path from 'path'
import fs from 'fs-extra'
import startWith from 'licia/startWith'
import { ipcMain, Notification, session } from 'electron'
import { getClipboardFilePaths } from '../clipboard'
import { captureScreen } from '../screen'
import { getFileIcon as getFileIconBuffer } from '../fileIcon'
import PQueue from 'p-queue'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import mime from 'mime'
import {
  getPlugins,
  plugins,
  getBuiltinPluginDir,
  loadSettingsPlugin,
} from './loader'
import * as pluginDownload from './download'
import * as pluginWebview from './webview'
import * as pluginInstaller from './installer'
import {
  PLUGIN_PARTITION,
  pluginViews,
  openPlugin,
  reopenPlugin,
  closePlugin,
  detachPlugin,
  togglePluginDevtools,
  showPluginContextMenu,
  exportPluginData,
  importPluginData,
  clearPluginData,
  preparePluginView,
  isPluginRunning,
} from './view'

export {
  closePlugin,
  detachPlugin,
  getAttachedPlugin,
  layoutPlugin,
} from './view'

const fileIconQueue = new PQueue({ concurrency: 1 })

const getFileIcon: IpcGetFileIcon = async function (filePath) {
  return fileIconQueue.add(async () => {
    const buffer = await getFileIconBuffer(filePath, 64)
    if (!buffer) {
      return ''
    }
    return `data:image/png;base64,${buffer.toString('base64')}`
  })
}

function nodeStreamToWeb(
  stream: NodeJS.ReadableStream
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)))
      stream.on('end', () => controller.close())
      stream.on('error', (err) => controller.error(err))
    },
    cancel() {
      if (typeof (stream as any).destroy === 'function') {
        ;(stream as any).destroy()
      }
    },
  })
}

export function init() {
  pluginDownload.init()
  pluginInstaller.init()
  pluginWebview.init()
  handleEvent('getPlugins', getPlugins)
  handleEvent('openPlugin', openPlugin)
  handleEvent('reopenPlugin', reopenPlugin)
  handleEvent('closePlugin', closePlugin)
  handleEvent('detachPlugin', detachPlugin)
  handleEvent('togglePluginDevtools', togglePluginDevtools)
  handleEvent('showPluginContextMenu', showPluginContextMenu)
  handleEvent('getClipboardFilePaths', getClipboardFilePaths)
  handleEvent('exportPluginData', exportPluginData)
  handleEvent('importPluginData', importPluginData)
  handleEvent('clearPluginData', clearPluginData)
  handleEvent('preparePluginView', preparePluginView)
  handleEvent('isPluginRunning', isPluginRunning)
  handleEvent('captureScreen', captureScreen)
  handleEvent('pluginGetFileIcon', getFileIcon)
  ipcMain.handle('showPluginNotification', (event, body: string) => {
    if (!Notification.isSupported()) {
      return
    }

    const options: Electron.NotificationConstructorOptions = {
      title: 'TINKER',
      body,
    }

    for (const id in pluginViews) {
      if (pluginViews[id].view.webContents === event.sender) {
        const plugin = plugins[id]
        if (plugin) {
          options.title = plugin.name
          if (plugin.icon) {
            options.icon = plugin.icon
          }
        }
        break
      }
    }

    new Notification(options).show()
  })

  ipcMain.handle('getAttachedPlugin', (event) => {
    for (const id in pluginViews) {
      if (pluginViews[id].view.webContents === event.sender) {
        return plugins[id]
      }
    }
  })

  loadSettingsPlugin()

  const pluginSession = session.fromPartition(PLUGIN_PARTITION)
  pluginSession.protocol.handle('plugin', async (request) => {
    const urlObj = new URL(request.url)
    const pluginId = urlObj.host
    const plugin = plugins[pluginId]
    let pathname = urlObj.pathname

    const prefix = `/plugin://${pluginId}/`
    if (pathname.startsWith(prefix)) {
      pathname = pathname.slice(prefix.length - 1)
    }

    let filePath = ''
    if (startWith(pathname, '/vendor/') && plugin.builtin) {
      filePath = path.join(
        getBuiltinPluginDir(),
        'vendor/dist',
        urlObj.pathname.replace('/vendor/', '')
      )
      if (!(await fs.pathExists(filePath))) {
        return new Response('Not Found', { status: 404 })
      }
    } else {
      filePath = path.join(plugin.root, pathname)
      if (await fs.pathExists(filePath)) {
        const stat = await fs.stat(filePath)
        if (stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html')
        }
      } else if (plugin.historyApiFallback) {
        filePath = path.join(plugin.root, 'index.html')
      }

      if (!(await fs.pathExists(filePath))) {
        return new Response('Not Found', { status: 404 })
      }
    }

    const type = mime.getType(filePath) || 'application/octet-stream'
    const fileStat = await fs.stat(filePath)
    const fileSize = fileStat.size

    const rangeHeader = request.headers.get('range')
    if (rangeHeader) {
      const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-')
      const start = toNum(startStr)
      const end = endStr ? toNum(endStr) : fileSize - 1
      const chunkSize = end - start + 1

      const nodeStream = fs.createReadStream(filePath, { start, end })
      const webStream = nodeStreamToWeb(nodeStream)

      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Type': type,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': toStr(chunkSize),
        },
      })
    }

    const nodeStream = fs.createReadStream(filePath)
    const webStream = nodeStreamToWeb(nodeStream)

    return new Response(webStream, {
      headers: {
        'Content-Type': type,
        'Accept-Ranges': 'bytes',
        'Content-Length': toStr(fileSize),
      },
    })
  })
}
