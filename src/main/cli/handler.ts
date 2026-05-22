import { app } from 'electron'
import {
  openPlugin,
  closePlugin,
  isPluginRunning,
  pluginViews,
} from '../lib/plugin/view'
import { getPlugins, hasPlugin } from '../lib/plugin/loader'
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

function success(req: IpcRequest, data?: unknown): IpcResponse {
  return { id: req.id, success: true, data }
}

function fail(req: IpcRequest, error: string): IpcResponse {
  return { id: req.id, success: false, error }
}

async function ensurePlugin(req: IpcRequest): Promise<string | IpcResponse> {
  await getPlugins()
  const id = req.data?.id as string
  if (!hasPlugin(id)) {
    return fail(req, `Plugin not found: ${id}`)
  }
  return id
}

async function handleIpcRequest(req: IpcRequest): Promise<IpcResponse> {
  try {
    switch (req.command) {
      case 'open': {
        const result = await ensurePlugin(req)
        if (typeof result !== 'string') return result
        openPlugin(result, true)
        return success(req)
      }
      case 'close': {
        const id = req.data?.id as string
        if (!isPluginRunning(id)) {
          return fail(req, `Plugin is not running: ${id}`)
        }
        await closePlugin(id, true)
        return success(req)
      }
      case 'restart': {
        const result = await ensurePlugin(req)
        if (typeof result !== 'string') return result
        if (isPluginRunning(result)) {
          await closePlugin(result, true)
        }
        openPlugin(result, true)
        return success(req)
      }
      case 'quit':
        setTimeout(() => app.quit(), 100)
        return success(req)
      case 'list': {
        const data = await listPlugins()
        return success(req, data)
      }
      case 'ps': {
        const data = listRunningPlugins()
        return success(req, data)
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
