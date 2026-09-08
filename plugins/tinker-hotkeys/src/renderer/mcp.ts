import isStrBlank from 'licia/isStrBlank'
import isUndef from 'licia/isUndef'
import trim from 'licia/trim'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Action, ActionInput, ActionType } from './types'
import type { Store } from './store'
import { actionUsesIcon } from './lib/util'
import pkg from '../../package.json'

interface IdArgs {
  id: string
}

interface AddArgs {
  name: string
  hotkey: string
  type: ActionType
  command: string
  enabled?: boolean
  appIcon?: string
}

interface UpdateArgs {
  id: string
  name?: string
  hotkey?: string
  type?: ActionType
  command?: string
  enabled?: boolean
  appIcon?: string | null
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list: (store) => listActions(store),
    get,
    add,
    update,
    delete: deleteAction,
    toggle,
  })
}

function serializeAction(store: Store, action: Action) {
  return {
    id: action.id,
    name: action.name,
    hotkey: action.hotkey,
    type: action.type,
    command: action.command,
    enabled: action.enabled,
    appIcon: action.appIcon ?? null,
    unbound: store.isUnbound(action.id),
  }
}

function listActions(store: Store) {
  return {
    count: store.actions.length,
    actions: store.actions.map((action) => serializeAction(store, action)),
  }
}

function requireAction(store: Store, id: string): Action {
  const action = store.actions.find((item) => item.id === id)
  if (!action) {
    throw new Error(`Action with id "${id}" not found.`)
  }
  return action
}

function get(store: Store, args: IdArgs) {
  return serializeAction(store, requireAction(store, args.id))
}

async function add(store: Store, args: AddArgs) {
  const name = trim(args.name)
  const hotkey = trim(args.hotkey)
  const command = trim(args.command)

  if (isStrBlank(name)) {
    throw new Error('name is required and cannot be empty.')
  }
  if (isStrBlank(hotkey)) {
    throw new Error('hotkey is required and cannot be empty.')
  }
  if (isStrBlank(command)) {
    throw new Error('command is required and cannot be empty.')
  }

  const input: ActionInput = {
    name,
    hotkey,
    command,
    type: args.type,
    enabled: args.enabled !== false,
    appIcon: actionUsesIcon(args.type) ? args.appIcon : undefined,
  }

  const action = await store.addAction(input)
  return {
    ...listActions(store),
    action: serializeAction(store, action),
  }
}

async function update(store: Store, args: UpdateArgs) {
  const existing = requireAction(store, args.id)

  if (
    isUndef(args.name) &&
    isUndef(args.hotkey) &&
    isUndef(args.type) &&
    isUndef(args.command) &&
    isUndef(args.enabled) &&
    isUndef(args.appIcon)
  ) {
    throw new Error(
      'Provide name, hotkey, type, command, enabled, and/or appIcon to update.'
    )
  }

  const type = args.type ?? existing.type
  const name = !isUndef(args.name) ? trim(args.name) : existing.name
  const hotkey = !isUndef(args.hotkey) ? trim(args.hotkey) : existing.hotkey
  const command = !isUndef(args.command) ? trim(args.command) : existing.command

  if (isStrBlank(name)) {
    throw new Error('name cannot be empty.')
  }
  if (isStrBlank(hotkey)) {
    throw new Error('hotkey cannot be empty.')
  }
  if (isStrBlank(command)) {
    throw new Error('command cannot be empty.')
  }

  let appIcon = existing.appIcon
  if (!actionUsesIcon(type)) {
    appIcon = undefined
  } else if (!isUndef(args.appIcon)) {
    appIcon = args.appIcon || undefined
  }

  const input: ActionInput = {
    name,
    hotkey,
    command,
    type,
    enabled: !isUndef(args.enabled) ? args.enabled : existing.enabled,
    appIcon,
  }

  await store.updateAction(args.id, input)
  return serializeAction(store, requireAction(store, args.id))
}

async function deleteAction(store: Store, args: IdArgs) {
  requireAction(store, args.id)
  await store.removeAction(args.id)
  return listActions(store)
}

async function toggle(store: Store, args: IdArgs) {
  requireAction(store, args.id)
  await store.toggleEnabled(args.id)
  return serializeAction(store, requireAction(store, args.id))
}
