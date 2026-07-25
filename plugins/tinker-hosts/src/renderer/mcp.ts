import contain from 'licia/contain'
import isUndef from 'licia/isUndef'
import trim from 'licia/trim'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { HostsConfig } from '../common/types'
import type { Store } from './store'
import pkg from '../../package.json'

interface IdArgs {
  id: string
}

interface AddArgs {
  name: string
  content?: string
}

interface UpdateArgs {
  id: string
  name?: string
  content?: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list: (store) => listConfigs(store),
    get,
    add,
    update,
    delete: deleteConfig,
    toggle,
  })
}

function serializeConfig(store: Store, config: HostsConfig) {
  return {
    id: config.id,
    name: config.name,
    active: contain(store.activeIds, config.id),
    content: config.content,
  }
}

function listConfigs(store: Store) {
  return {
    hostsPath: hosts.getHostsPath(),
    selectedId: store.selectedId,
    viewMode: store.viewMode,
    activeIds: [...store.activeIds],
    configs: store.configs.map((config) => ({
      id: config.id,
      name: config.name,
      active: contain(store.activeIds, config.id),
    })),
  }
}

function requireConfig(store: Store, id: string): HostsConfig {
  const config = store.configs.find((item) => item.id === id)
  if (!config) {
    throw new Error(`Config with id "${id}" not found.`)
  }
  return config
}

async function applyHostsOrThrow(store: Store) {
  try {
    await store.applyHosts()
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to apply hosts.'
    )
  }
}

async function get(store: Store, args: IdArgs) {
  if (args.id === 'system') {
    await store.loadSystemHosts()
    store.setViewMode('system')
    return {
      id: 'system',
      name: 'System Hosts',
      path: hosts.getHostsPath(),
      content: store.systemHosts,
      readonly: true,
    }
  }

  const config = requireConfig(store, args.id)
  store.setSelectedId(config.id)
  store.setViewMode('config')
  return serializeConfig(store, config)
}

function add(store: Store, args: AddArgs) {
  const name = trim(args.name)
  if (!name) {
    throw new Error('name is required and cannot be empty.')
  }

  const id = store.addConfig(name, args.content ?? '')
  const config = requireConfig(store, id)
  return {
    ...listConfigs(store),
    config: serializeConfig(store, config),
  }
}

async function update(store: Store, args: UpdateArgs) {
  const config = requireConfig(store, args.id)

  if (isUndef(args.name) && isUndef(args.content)) {
    throw new Error('Provide name and/or content to update.')
  }

  if (!isUndef(args.name)) {
    const name = trim(args.name)
    if (!name) {
      throw new Error('name cannot be empty.')
    }
    store.renameConfig(args.id, name)
  }

  if (!isUndef(args.content)) {
    store.updateConfig(args.id, args.content)
    if (contain(store.activeIds, args.id)) {
      await applyHostsOrThrow(store)
    }
  }

  store.setSelectedId(args.id)
  store.setViewMode('config')

  return serializeConfig(store, requireConfig(store, config.id))
}

async function deleteConfig(store: Store, args: IdArgs) {
  requireConfig(store, args.id)
  const wasActive = contain(store.activeIds, args.id)
  store.deleteConfig(args.id)

  if (wasActive) {
    await applyHostsOrThrow(store)
  }

  return listConfigs(store)
}

async function toggle(store: Store, args: IdArgs) {
  requireConfig(store, args.id)
  store.toggleActive(args.id)
  await applyHostsOrThrow(store)
  return serializeConfig(store, requireConfig(store, args.id))
}
