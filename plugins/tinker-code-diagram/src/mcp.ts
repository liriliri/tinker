import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get,
    set,
  })
}

function get(store: Store) {
  return {
    content: store.codeInput,
    viewMode: store.viewMode,
    lineCount: store.lineCount,
    isEmpty: store.isEmpty,
    renderError: store.renderError,
  }
}

function set(store: Store, args: Record<string, unknown>) {
  store.setCodeInput(args.content as string)
  return get(store)
}
