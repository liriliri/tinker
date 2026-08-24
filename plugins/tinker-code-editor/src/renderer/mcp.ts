import normalizePath from 'licia/normalizePath'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../../package.json'

interface OpenProjectArgs {
  path: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open_project: openProject,
  })
}

async function openProject(store: Store, args: OpenProjectArgs) {
  let stat: tinker.FileStats
  try {
    stat = await tinker.fstat(args.path)
  } catch {
    throw new Error(`Directory not found: ${args.path}`)
  }
  if (!stat.isDirectory) {
    throw new Error(`Not a directory: ${args.path}`)
  }

  const path = normalizePath(args.path)
  store.openProject(path)
  return { path }
}
