import isStrBlank from 'licia/isStrBlank'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../../package.json'

interface SearchArgs {
  query: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    search,
  })
}

async function search(store: Store, args: SearchArgs) {
  if (isStrBlank(args.query)) {
    throw new Error('query must not be empty.')
  }

  store.query = args.query
  await store.search()

  return {
    query: store.query,
    count: store.results.length,
    hasMore: store.hasMore,
    results: store.results,
  }
}
