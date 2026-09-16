import normalizePath from 'licia/normalizePath'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../../package.json'

interface OpenArgs {
  arg: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open,
  })
}

async function open(store: Store, args: OpenArgs) {
  const path = normalizePath(args.arg)
  let stat: tinker.FileStats
  try {
    stat = await tinker.fstat(path)
  } catch {
    throw new Error(`Directory not found: ${path}`)
  }
  if (!stat.isDirectory) {
    throw new Error(`Not a directory: ${path}`)
  }

  store.openProject(path)
  return { path }
}
