import waitUntil from 'licia/waitUntil'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { findBranch } from './lib/dataProcess'
import type { Store } from './store'
import type { DiskItem } from './types'
import pkg from '../../package.json'

interface ScanArgs {
  path: string
}

interface NavigateArgs {
  path: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    scan,
    get: (store) => getDistribution(store),
    navigate,
  })
}

function serializeEntry(item: DiskItem) {
  return {
    path: item.id,
    name: item.name,
    size: item.size,
    isDirectory: item.isDirectory,
    loaded: !!item.loaded,
  }
}

function serialize(store: Store) {
  const current = store.currentData
  if (!current) {
    return {
      scanning: store.view === 'scanning',
      scanPath: store.scanPath || null,
      navigatePath: store.navigatePath || null,
      path: null,
      name: null,
      size: 0,
      children: [] as ReturnType<typeof serializeEntry>[],
    }
  }

  const children = (current.children || [])
    .slice()
    .sort((a, b) => b.size - a.size)
    .map(serializeEntry)

  return {
    scanning: false,
    scanPath: store.scanPath,
    navigatePath: store.navigatePath || current.id,
    path: current.id,
    name: current.name,
    size: current.size,
    isDirectory: current.isDirectory,
    children,
  }
}

async function waitForIdle(store: Store) {
  if (store.view === 'scanning') {
    await waitUntil(() => store.view !== 'scanning', 600000)
  }
}

async function assertDirectory(path: string) {
  try {
    const stat = await tinker.fstat(path)
    if (!stat.isDirectory) {
      throw new Error(`Not a directory: ${path}`)
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Not a directory')) {
      throw error
    }
    throw new Error(`Directory not found: ${path}`)
  }
}

async function getDistribution(store: Store) {
  await waitForIdle(store)
  if (!store.diskData) {
    throw new Error('No scan results. Call scan first.')
  }
  return serialize(store)
}

async function scan(store: Store, args: ScanArgs) {
  await waitForIdle(store)
  await assertDirectory(args.path)
  await store.openDirectory(args.path)

  if (!store.diskData) {
    throw new Error(`Failed to scan directory: ${args.path}`)
  }

  return serialize(store)
}

async function navigate(store: Store, args: NavigateArgs) {
  await waitForIdle(store)

  if (!store.diskData) {
    throw new Error('No scan results. Call scan first.')
  }

  const path = args.path === store.diskData.id ? '' : args.path
  if (path) {
    const target = findBranch(path, store.diskData)
    if (!target) {
      throw new Error(
        `Path "${path}" not found in scan results. Use a path from children.`
      )
    }
    if (!target.isDirectory) {
      throw new Error(`Not a directory: ${path}`)
    }
  }

  await store.navigateTo(path)
  return serialize(store)
}
