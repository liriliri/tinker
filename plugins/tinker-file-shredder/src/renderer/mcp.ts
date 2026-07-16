import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { ShredMethod } from '../common/types'
import type { Store } from './store'
import pkg from '../../package.json'

interface ShredArgs {
  paths: string[]
  method?: ShredMethod
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    shred,
  })
}

async function shred(store: Store, args: ShredArgs) {
  if (store.shredding) {
    throw new Error('Shredding is already in progress.')
  }

  const { paths } = args
  const method = args.method ?? store.shredMethod

  for (const filePath of paths) {
    const stat = await fileShredder.statFile(filePath)
    if (!stat?.isFile) {
      throw new Error(`File not found: ${filePath}`)
    }
  }

  store.clearFiles()
  store.setShredMethod(method)
  await store.addFilePaths(paths)

  if (store.pendingCount === 0) {
    throw new Error('No files to shred.')
  }

  const result = await store.shredAll()
  if (!result) {
    throw new Error('Failed to shred files.')
  }

  return {
    method,
    shredded: result.shredded,
    errors: result.errors,
  }
}
