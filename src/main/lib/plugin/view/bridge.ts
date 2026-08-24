import {
  IpcCallMcpTool,
  IpcClearPluginData,
  IpcExportPluginData,
  IpcImportPluginData,
  IpcShowPluginContextMenu,
  IpcTogglePluginDevtools,
} from 'common/types'
import waitUntil from 'licia/waitUntil'
import { BrowserWindow, WebContents } from 'electron'
import contextMenu from '../../contextMenu'
import { plugins, getPlugins, hasPlugin } from '../loader'
import { callExternalMcpTool, validateMcpToolArgs } from '../../mcp'
import { pluginViews } from './state'
import { getWebContentsPlugin } from './lifecycle'

export async function callPluginMcpTool(
  id: string,
  name: string,
  args: Record<string, unknown> = {}
): Promise<string> {
  if (!id || !name) {
    throw new Error('Missing plugin id or tool name')
  }

  const entry = pluginViews[id]
  if (!entry) {
    throw new Error(
      `Plugin is not running. Please start it first: tinker open ${id}`
    )
  }

  await getPlugins()
  if (!hasPlugin(id)) {
    throw new Error(`Plugin not found: ${id}`)
  }

  const plugin = plugins[id]
  const tools = plugin.mcp?.tools
  if (!tools || !tools[name]) {
    throw new Error(`Unknown tool "${name}"`)
  }

  const validationError = validateMcpToolArgs(
    `${id}:${name}`,
    tools[name].inputSchema,
    args
  )
  if (validationError) {
    throw new Error(validationError)
  }

  const script = `(async function() {
    if (!window.mcp || typeof window.mcp.callTool !== 'function') {
      return null;
    }
    try {
      return await window.mcp.callTool(${JSON.stringify(
        name
      )}, ${JSON.stringify(args)});
    } catch (e) {
      return 'Error: ' + (e.message || String(e));
    }
  })()`

  try {
    const resolved = await waitUntil(
      async () => {
        const result = await entry.view.webContents.executeJavaScript(
          script,
          true
        )
        return result === null ? false : { result: result as string }
      },
      5000,
      100
    )
    if (resolved) {
      return resolved.result
    }
  } catch {
    // timeout or executeJavaScript failure
  }
  throw new Error(
    'Plugin MCP API is not ready. Please wait for the plugin to finish loading.'
  )
}

export const callMcpTool: IpcCallMcpTool = async function (
  target,
  name,
  args = {}
) {
  if (typeof target === 'string') {
    return callPluginMcpTool(target, name, args)
  }
  return callExternalMcpTool(target, name, args)
}

export const togglePluginDevtools: IpcTogglePluginDevtools = function (id) {
  const entry = pluginViews[id]
  if (!entry?.view) {
    return
  }

  const { webContents } = entry.view
  if (webContents.isDevToolsOpened()) {
    webContents.closeDevTools()
  } else {
    webContents.openDevTools({ mode: 'detach' })
  }
}

export function showPluginContextMenu(
  webContents: WebContents,
  x: number,
  y: number,
  options: Parameters<IpcShowPluginContextMenu>[2]
) {
  const plugin = getWebContentsPlugin(webContents)
  if (!plugin) {
    return
  }

  const entry = pluginViews[plugin.id]
  if (!entry) {
    return
  }
  const { view, win } = entry
  const focused = BrowserWindow.fromWebContents(webContents)

  if (webContents !== view.webContents) {
    contextMenu(webContents, x, y, options, focused)
    return
  }

  const bounds = view.getBounds()
  x += bounds.x
  y += bounds.y

  contextMenu(webContents, x, y, options, win)
}

export const exportPluginData: IpcExportPluginData = function (id) {
  evalPluginRendererMenu(id, 'exportData', id)
}

export const importPluginData: IpcImportPluginData = function (id) {
  evalPluginRendererMenu(id, 'importData')
}

export const clearPluginData: IpcClearPluginData = function (id) {
  evalPluginRendererMenu(id, 'clearData')
}

export type PluginRendererFn =
  | 'importData'
  | 'exportData'
  | 'clearData'
  | 'showRecordingCursor'
  | 'hideRecordingCursor'
  | 'moveRecordingCursorTo'

function evalPluginRendererMenu(
  id: string,
  fn: PluginRendererFn,
  ...args: unknown[]
) {
  void evalPluginRenderer(id, fn, ...args).catch(() => {})
}

export async function evalPluginRenderer(
  id: string,
  fn: PluginRendererFn,
  ...args: unknown[]
) {
  const { view } = pluginViews[id] || {}
  if (!view) {
    throw new Error(`Plugin is not running: ${id}`)
  }

  try {
    await waitUntil(
      async () => {
        const ready = await view.webContents.executeJavaScript(
          'typeof _tinkerRenderer !== "undefined"',
          true
        )
        return !!ready
      },
      5000,
      100
    )
  } catch {
    throw new Error(
      'Plugin renderer is not ready. Please wait for the plugin to finish loading.'
    )
  }

  const call = `_tinkerRenderer.${fn}(${args
    .map((arg) => JSON.stringify(arg))
    .join(', ')})`
  const result = await view.webContents.executeJavaScript(
    `(async () => {
      try {
        return await ${call}
      } catch (e) {
        return { error: e.message || String(e) }
      }
    })()`,
    true
  )

  if (
    result &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    'error' in result
  ) {
    throw new Error(String((result as { error: unknown }).error))
  }

  return result
}
