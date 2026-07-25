import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../../package.json'

interface GetArgs {
  includeHistory?: boolean
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get,
  })
}

async function get(store: Store, args: GetArgs) {
  await store.refresh()

  if (!store.payload) {
    throw new Error('Failed to refresh system monitor.')
  }

  const includeHistory = args.includeHistory ?? false
  const { current, textMetrics, history } = store.payload

  return {
    paused: store.paused,
    current,
    textMetrics,
    ...(includeHistory ? { history } : {}),
  }
}
