import { app } from 'electron'
import { openPlugin, closePlugin, pluginViews } from '../lib/plugin/view'
import { getPlugins } from '../lib/plugin/loader'
import { startServer, stopServer, IpcRequest, IpcResponse } from './ipc'

async function listPlugins() {
  const plugins = await getPlugins()
  return plugins
    .filter((p) => !p.marketplace)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      version: p.version,
      builtin: p.builtin,
    }))
}

function listRunningPlugins() {
  return Object.keys(pluginViews).map((id) => ({
    id,
    pid: pluginViews[id].view.webContents.getOSProcessId(),
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
        await closePlugin(req.data?.id as string, true)
        return { id: req.id, success: true }
      case 'quit':
        setTimeout(() => app.quit(), 100)
        return { id: req.id, success: true }
      case 'list': {
        const data = await listPlugins()
        return { id: req.id, success: true, data }
      }
      case 'ps': {
        const data = listRunningPlugins()
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
