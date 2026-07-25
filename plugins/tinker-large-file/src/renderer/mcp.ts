import isUndef from 'licia/isUndef'
import waitUntil from 'licia/waitUntil'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { FilterTab } from './types'
import type { Store } from './store'
import pkg from '../../package.json'

interface ScanArgs {
  path: string
}

interface GetArgs {
  filter?: FilterTab
}

interface CleanArgs {
  paths: string[]
  moveToTrash?: boolean
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    scan,
    get: getResults,
    clean,
  })
}

function serialize(store: Store) {
  return {
    scanning: store.view === 'scanning',
    scanPath: store.scanPath || null,
    moveToTrash: store.moveToTrash,
    filter: store.filterTab,
    fileCount: store.filteredFiles.length,
    selectedCount: store.selectedCount,
    selectedSize: store.selectedSize,
    files: store.filteredFiles.map((file) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      selected: store.selectedFiles.has(file.path),
    })),
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

async function getResults(store: Store, args: GetArgs = {}) {
  await waitForIdle(store)

  if (store.view !== 'result') {
    throw new Error('No scan results. Call scan first.')
  }

  if (!isUndef(args.filter) && args.filter !== store.filterTab) {
    store.setFilterTab(args.filter)
  }

  return serialize(store)
}

async function scan(store: Store, args: ScanArgs) {
  await waitForIdle(store)
  await assertDirectory(args.path)

  store.reset()
  await store.openDirectory(args.path)

  if (store.view !== 'result') {
    throw new Error(`Failed to scan directory: ${args.path}`)
  }

  return serialize(store)
}

async function clean(store: Store, args: CleanArgs) {
  await waitForIdle(store)

  if (store.view !== 'result') {
    throw new Error('No scan results. Call scan first.')
  }

  const knownPaths = new Set(store.largeFiles.map((file) => file.path))

  for (const path of args.paths) {
    if (!knownPaths.has(path)) {
      throw new Error(`File not in scan results: ${path}`)
    }
  }

  if (!isUndef(args.moveToTrash)) {
    store.setMoveToTrash(args.moveToTrash)
  }

  store.selectedFiles = new Set(args.paths)
  const result = await store.deleteSelected()
  if (!result) {
    throw new Error('Clean failed.')
  }

  return {
    deleted: result.deleted,
    errors: result.errors,
    ...serialize(store),
  }
}
