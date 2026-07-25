import isUndef from 'licia/isUndef'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { ProcessInfo } from '../common/types'
import type { ViewMode } from './types'
import type { Store } from './store'
import pkg from '../../package.json'

interface ListArgs {
  query?: string
  view?: ViewMode
}

interface KillArgs {
  pid: number
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list,
    kill,
  })
}

function serializeProcess(proc: ProcessInfo) {
  return {
    pid: proc.pid,
    name: proc.name,
    cpu: proc.cpu,
    mem: proc.mem,
    memRss: proc.memRss,
    user: proc.user,
    command: proc.command ?? null,
    path: proc.path ?? null,
    state: proc.state ?? null,
    ports: proc.ports ?? null,
  }
}

function serialize(store: Store) {
  return {
    view: store.viewMode,
    query: store.searchKeyword,
    sortField: store.sortField,
    sortOrder: store.sortOrder,
    count: store.filteredProcesses.length,
    processes: store.filteredProcesses.map(serializeProcess),
  }
}

async function list(store: Store, args: ListArgs = {}) {
  store.setViewMode(args.view ?? 'cpu')
  if (!isUndef(args.query)) {
    store.setSearchKeyword(args.query)
  } else if (store.searchKeyword) {
    store.setSearchKeyword('')
  }

  await store.refreshProcessList(false)
  return serialize(store)
}

async function kill(store: Store, args: KillArgs) {
  await store.refreshProcessList(false)

  const proc = store.processes.find((item) => item.pid === args.pid)
  if (!proc) {
    throw new Error(`Process with pid ${args.pid} not found.`)
  }

  try {
    await store.forceKillProcess(args.pid)
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : `Failed to kill process ${args.pid}.`
    )
  }

  return {
    killed: true,
    pid: proc.pid,
    name: proc.name,
    ...serialize(store),
  }
}
