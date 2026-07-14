import filter from 'licia/filter'
import lowerCase from 'licia/lowerCase'
import isStrBlank from 'licia/isStrBlank'
import stripHtmlTag from 'licia/stripHtmlTag'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store, Sticky } from './store'
import { STICKY_COLORS } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list: getStickies,
    add: addSticky,
    update: updateSticky,
    delete: deleteSticky,
  })
}

function requireSticky(store: Store, id: string): Sticky {
  const sticky = store.stickies.find((s) => s.id === id)
  if (!sticky) {
    throw new Error(`Sticky with id "${id}" not found.`)
  }
  return sticky
}

function validateColor(color: string) {
  if (!STICKY_COLORS.includes(color)) {
    throw new Error(
      `Invalid color "${color}". Must be one of: ${STICKY_COLORS.join(', ')}`
    )
  }
}

function getStickies(store: Store, args: { search?: string }) {
  let stickies = store.stickies

  if (args.search !== undefined && !isStrBlank(args.search)) {
    const query = lowerCase(args.search)
    stickies = filter(stickies, (s) =>
      lowerCase(stripHtmlTag(s.content)).includes(query)
    )
  }

  return {
    count: stickies.length,
    stickies,
  }
}

function addSticky(store: Store, args: { content?: string; color?: string }) {
  if (args.color !== undefined) {
    validateColor(args.color)
  }

  const id = store.addSticky()

  if (args.content !== undefined) {
    store.updateSticky(id, args.content)
  }
  if (args.color !== undefined) {
    store.updateStickyColor(id, args.color)
  }

  const sticky = store.stickies.find((s) => s.id === id)
  if (!sticky) {
    throw new Error('Failed to create sticky.')
  }

  return { sticky }
}

function updateSticky(
  store: Store,
  args: { id: string; content?: string; color?: string }
) {
  requireSticky(store, args.id)

  if (args.content !== undefined) {
    store.updateSticky(args.id, args.content)
  }

  if (args.color !== undefined) {
    validateColor(args.color)
    store.updateStickyColor(args.id, args.color)
  }

  const updated = store.stickies.find((s) => s.id === args.id)
  if (!updated) {
    throw new Error(`Sticky with id "${args.id}" not found.`)
  }

  return { sticky: updated }
}

function deleteSticky(store: Store, args: { id: string }) {
  requireSticky(store, args.id)

  store.deleteSticky(args.id)
  return { deleted: true, id: args.id }
}
