import waitUntil from 'licia/waitUntil'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { SystemInfoData } from '../common/types'
import type { Store } from './store'
import pkg from '../../package.json'

const SECTION_KEYS = {
  system: 'system',
  cpu: 'cpu',
  mem: 'mem',
  graphics: 'graphics',
  os: 'osInfo',
  disk: 'diskLayout',
  audio: 'audio',
  network: 'networkInterfaces',
} as const

type Section = keyof typeof SECTION_KEYS

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get: getSystemInfo,
  })
}

async function getSystemInfo(store: Store, args: Record<string, unknown>) {
  const refresh = (args.refresh as boolean | undefined) ?? false
  const section = args.section as Section | undefined
  const info = await ensureSystemInfo(store, refresh)

  if (!section) {
    return info
  }

  const key = SECTION_KEYS[section]
  return { [key]: info[key] }
}

async function ensureSystemInfo(
  store: Store,
  refresh: boolean
): Promise<SystemInfoData> {
  if (refresh || (!store.systemInfo && !store.isLoading)) {
    await store.fetchSystemInfo()
  } else if (store.isLoading) {
    await waitUntil(() => !store.isLoading, 30000)
  }

  if (!store.systemInfo) {
    throw new Error('Failed to fetch system info.')
  }

  return store.systemInfo
}
