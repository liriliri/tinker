import {
  getMcpToolsFromPackage,
  mcpToolsToOpenAiDefinitions,
  registerPluginMcp,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  const toolDefinitions = mcpToolsToOpenAiDefinitions(
    getMcpToolsFromPackage(pkg)
  )

  return registerPluginMcp({
    callTool: (name, args) => executeTool(getStore(), name, args),
    createAgentTools: () =>
      toolDefinitions.map((definition) => ({
        definition,
        execute: (args) =>
          executeTool(getStore(), definition.function.name, args),
      })),
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set_json': {
      const content = typeof args.content === 'string' ? args.content : ''
      return content.length > 60 ? `${content.slice(0, 60)}…` : content
    }
    default:
      return ''
  }
}

function executeTool(
  store: Store,
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'get_json':
      return getJson(store)
    case 'set_json':
      return setJson(store, args)
    case 'format_json':
      return formatJson(store)
    case 'minify_json':
      return minifyJson(store)
    default:
      return `Error: Unknown tool "${name}"`
  }
}

function getJson(store: Store): string {
  return JSON.stringify(
    {
      content: store.jsonInput,
      error: store.jsonError,
      mode: store.mode,
      lineCount: store.lineCount,
      isEmpty: store.isEmpty,
      fileName: store.currentFileName,
    },
    null,
    2
  )
}

function setJson(store: Store, args: Record<string, unknown>): string {
  const content = typeof args.content === 'string' ? args.content : ''
  store.setJsonInput(content)
  return getJson(store)
}

function formatJson(store: Store): string {
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

function minifyJson(store: Store): string {
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
