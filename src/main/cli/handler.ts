import { app } from 'electron'
import { openPlugin, pluginViews } from '../lib/plugin/view'
import { getPlugins } from '../lib/plugin/loader'
import * as window from 'share/main/lib/window'
import { startServer, stopServer, IpcRequest, IpcResponse } from './ipc'

function closePlugin(id: string) {
  const entry = pluginViews[id]
  if (!entry) return
  const { view, win } = entry
  const mainWin = window.getWin('main')
  if (win) {
    if (win === mainWin) {
      window.sendTo('main', 'closePlugin')
    } else {
      win.close()
    }
  }
  view.webContents.close()
  delete pluginViews[id]
}

async function listPlugins() {
  const plugins = await getPlugins()
  return plugins.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    version: p.version,
    builtin: p.builtin,
  }))
}

async function handleIpcRequest(req: IpcRequest): Promise<IpcResponse> {
  try {
    switch (req.command) {
      case 'open':
        await getPlugins()
        openPlugin(req.data?.id as string, true)
        return { id: req.id, success: true }
      case 'close':
        closePlugin(req.data?.id as string)
        return { id: req.id, success: true }
      case 'quit':
        setTimeout(() => app.quit(), 100)
        return { id: req.id, success: true }
      case 'list': {
        const data = await listPlugins()
        return { id: req.id, success: true, data }
      }
      default:
        return {
          id: req.id,
          success: false,
          error: `Unknown command: ${req.command}`,
        }
    }
  } catch (err: any) {
    return { id: req.id, success: false, error: err.message || String(err) }
  }
}

export function init() {
  app.on('ready', () => {
    startServer(handleIpcRequest)
  })

  app.on('will-quit', () => {
    stopServer()
  })
}
