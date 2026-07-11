import {
  createPluginMcpApi,
  truncateMcpArg,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get,
    set,
    format,
    minify,
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set': {
      const content = typeof args.content === 'string' ? args.content : ''
      return truncateMcpArg(content)
    }
    default:
      return ''
  }
}

function get(store: Store) {
  return {
    content: store.jsonInput,
    error: store.jsonError,
    mode: store.mode,
    lineCount: store.lineCount,
    isEmpty: store.isEmpty,
    fileName: store.currentFileName,
  }
}

function set(store: Store, args: Record<string, unknown>) {
  store.setJsonInput(args.content as string)
  return get(store)
}

function format(store: Store) {
  if (store.isEmpty) {
    return 'Error: Editor is empty.'
  }

  try {
    store.formatJson()
    return get(store)
  } catch {
    return `Error: ${store.jsonError || 'Invalid JSON'}`
  }
}

function minify(store: Store) {
  if (store.isEmpty) {
    return 'Error: Editor is empty.'
  }

  try {
    store.minifyJson()
    return get(store)
  } catch {
    return `Error: ${store.jsonError || 'Invalid JSON'}`
  }
}
