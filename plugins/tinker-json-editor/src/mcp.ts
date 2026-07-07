import {
  createPluginMcpApi,
  truncateMcpArg,
  type McpToolHandlerResult,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get_json: (store) => getJson(store),
    set_json: setJson,
    format_json: (store) => formatJson(store),
    minify_json: (store) => minifyJson(store),
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set_json': {
      const content = typeof args.content === 'string' ? args.content : ''
      return truncateMcpArg(content)
    }
    default:
      return ''
  }
}

function getJson(store: Store): McpToolHandlerResult {
  return {
    content: store.jsonInput,
    error: store.jsonError,
    mode: store.mode,
    lineCount: store.lineCount,
    isEmpty: store.isEmpty,
    fileName: store.currentFileName,
  }
}

function setJson(
  store: Store,
  args: Record<string, unknown>
): McpToolHandlerResult {
  store.setJsonInput(args.content as string)
  return getJson(store)
}

function formatJson(store: Store): McpToolHandlerResult {
  if (store.isEmpty) {
    return 'Error: Editor is empty.'
  }

  try {
    store.formatJson()
    return getJson(store)
  } catch {
    return `Error: ${store.jsonError || 'Invalid JSON'}`
  }
}

function minifyJson(store: Store): McpToolHandlerResult {
  if (store.isEmpty) {
    return 'Error: Editor is empty.'
  }

  try {
    store.minifyJson()
    return getJson(store)
  } catch {
    return `Error: ${store.jsonError || 'Invalid JSON'}`
  }
}
