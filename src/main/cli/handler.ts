import { app } from 'electron'
import {
  openPlugin,
  closePlugin,
  isPluginRunning,
  pluginViews,
  callPluginMcpTool,
} from '../lib/plugin/view'
import { getPlugins, hasPlugin, plugins } from '../lib/plugin/loader'
import { startServer, stopServer, IpcRequest, IpcResponse } from './ipc'
import { validateMcpToolArgs } from './mcp'

function success(req: IpcRequest, data?: unknown): IpcResponse {
  return { id: req.id, success: true, data }
}

function fail(req: IpcRequest, error: string): IpcResponse {
  return { id: req.id, success: false, error }
}

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
      mcp: !!p.mcp,
    }))
}

function listRunningPlugins() {
  return Object.keys(pluginViews).map((id) => ({
    id,
    pid: pluginViews[id].view.webContents.getOSProcessId(),
  }))
}

async function ensurePlugin(req: IpcRequest): Promise<string | IpcResponse> {
  await getPlugins()
  const id = req.data?.id as string
  if (!hasPlugin(id)) {
    return fail(req, `Plugin not found: ${id}`)
  }
  return id
}

function pluginNotRunningMessage(id: string) {
  const shortName = id.replace(/^tinker-/, '')
  return `Plugin is not running. Please start it first: tinker open ${shortName}`
}

async function callMcpTool(req: IpcRequest): Promise<IpcResponse> {
  const id = req.data?.id as string
  const name = req.data?.name as string
  const args = (req.data?.args as Record<string, unknown>) || {}
  if (!id || !name) {
    return fail(req, 'Missing plugin id or tool name')
  }
  if (!isPluginRunning(id)) {
    return fail(req, pluginNotRunningMessage(id))
  }

  await getPlugins()
  if (!hasPlugin(id)) {
    return fail(req, `Plugin not found: ${id}`)
  }

  const plugin = plugins[id]
  const tools = plugin.mcp?.tools
  if (!tools || !tools[name]) {
    return fail(req, `Unknown tool "${name}"`)
  }

  const validationError = validateMcpToolArgs(
    `${id}:${name}`,
    tools[name].inputSchema,
    args
  )
  if (validationError) {
    return fail(req, validationError)
  }

  try {
    const result = await callPluginMcpTool(id, name, args)
    return success(req, result)
  } catch (err: any) {
    return fail(req, err.message || String(err))
  }
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
      case 'getPlugin': {
        const result = await ensurePlugin(req)
        if (typeof result !== 'string') return result
        return success(req, plugins[result])
      }
      case 'ps': {
        const data = listRunningPlugins()
        return success(req, data)
      }
      case 'callMcpTool':
        return callMcpTool(req)
      default:
        return fail(req, `Unknown command: ${req.command}`)
    }
  } catch (err: any) {
    return fail(req, err.message || String(err))
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
