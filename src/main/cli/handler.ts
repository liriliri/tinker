import { app } from 'electron'
import {
  openPlugin,
  closePlugin,
  isPluginRunning,
  pluginViews,
  callPluginMcpTool,
  startPluginInspectForRunning,
  evalPluginRenderer,
} from '../lib/plugin/view'
import { getPlugins, hasPlugin, plugins } from '../lib/plugin/loader'
import { getMainStore } from '../lib/store'
import { parseInspectAddress } from '../lib/plugin/inspect'
import { runUiCommand, disposeAllUiSessions } from '../lib/plugin/ui'
import { startHttp, stopHttp, resolveHttpAddress } from '../lib/http'
import { startServer, stopServer, IpcRequest, IpcResponse } from './ipc'

function success(req: IpcRequest, data?: unknown): IpcResponse {
  return { id: req.id, success: true, data }
}

function fail(req: IpcRequest, error: string): IpcResponse {
  return { id: req.id, success: false, error }
}

async function listPlugins() {
  const plugins = await getPlugins()
  const pluginStates = getMainStore().get('pluginStates') || {}
  return plugins
    .filter((p) => !p.marketplace)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      version: p.version,
      builtin: p.builtin,
      mcp: !!p.mcp,
      background: !!pluginStates[p.id]?.runInBackground,
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

async function ensureRunningPlugin(
  req: IpcRequest
): Promise<string | IpcResponse> {
  const result = await ensurePlugin(req)
  if (typeof result !== 'string') {
    return result
  }
  if (!isPluginRunning(result)) {
    return fail(
      req,
      `Plugin is not running. Please start it first: tinker open ${result}`
    )
  }
  return result
}

async function runPluginData(
  req: IpcRequest,
  run: (id: string) => Promise<unknown>
): Promise<IpcResponse> {
  const result = await ensureRunningPlugin(req)
  if (typeof result !== 'string') {
    return result
  }
  try {
    const data = await run(result)
    return success(req, data)
  } catch (err: any) {
    return fail(req, err.message || String(err))
  }
}

async function callMcpTool(req: IpcRequest): Promise<IpcResponse> {
  const id = req.data?.id as string
  const name = req.data?.name as string
  const args = (req.data?.args as Record<string, unknown>) || {}
  try {
    const result = await callPluginMcpTool(id, name, args)
    return success(req, result)
  } catch (err: any) {
    return fail(req, err.message || String(err))
  }
}

async function startInspectIfNeeded(
  req: IpcRequest,
  id: string
): Promise<string | undefined> {
  if (req.data?.inspect === undefined) {
    return undefined
  }
  const address = parseInspectAddress(req.data.inspect)
  if (!address) {
    return undefined
  }
  return startPluginInspectForRunning(id, address)
}

async function handleIpcRequest(req: IpcRequest): Promise<IpcResponse> {
  try {
    switch (req.command) {
      case 'open': {
        const result = await ensurePlugin(req)
        if (typeof result !== 'string') return result
        openPlugin(result, true, !!req.data?.headless)
        const inspectUrl = await startInspectIfNeeded(req, result)
        return success(req, inspectUrl ? { inspectUrl } : undefined)
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
        const inspectUrl = await startInspectIfNeeded(req, result)
        return success(req, inspectUrl ? { inspectUrl } : undefined)
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
      case 'exportData': {
        const filePath = req.data?.path as string
        if (!filePath) {
          return fail(req, 'Missing output path')
        }
        return runPluginData(req, (id) =>
          evalPluginRenderer(id, 'exportData', id, filePath)
        )
      }
      case 'importData': {
        const filePath = req.data?.path as string
        if (!filePath) {
          return fail(req, 'Missing input path')
        }
        return runPluginData(req, (id) =>
          evalPluginRenderer(id, 'importData', filePath)
        )
      }
      case 'clearData':
        return runPluginData(req, (id) =>
          evalPluginRenderer(id, 'clearData', true)
        )
      case 'ui': {
        const result = await ensurePlugin(req)
        if (typeof result !== 'string') return result
        const action = req.data?.action as string
        if (!action) {
          return fail(req, 'Missing ui action')
        }
        try {
          const output = await runUiCommand(result, {
            action,
            args: (req.data?.args as string[]) || [],
            options: (req.data?.options as Record<string, unknown>) || {},
          })
          return success(req, output)
        } catch (err: any) {
          return fail(req, err.message || String(err))
        }
      }
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
    const httpAddress = resolveHttpAddress()
    if (httpAddress) {
      startHttp(httpAddress)
        .then((info) => {
          console.log(`HTTP remote listening on ${info.url}`)
        })
        .catch((err) => {
          console.error('[http]', err?.message || err)
        })
    }
  })

  app.on('will-quit', () => {
    disposeAllUiSessions()
    void stopHttp()
    stopServer()
  })
}
