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

function requireSticky(store: Store, id: string): Sticky | string {
  const sticky = store.stickies.find((s) => s.id === id)
  if (!sticky) {
    return `Error: Sticky with id "${id}" not found.`
  }
  return sticky
}

function validateColor(color: string): string | null {
  if (!STICKY_COLORS.includes(color)) {
    return `Error: Invalid color "${color}". Must be one of: ${STICKY_COLORS.join(
      ', '
    )}`
  }
  return null
}

function getStickies(store: Store, args: Record<string, unknown>) {
  let stickies = store.stickies
  const search = args.search as string | undefined

  if (search !== undefined && !isStrBlank(search)) {
    const query = lowerCase(search)
    stickies = filter(stickies, (s) =>
      lowerCase(stripHtmlTag(s.content)).includes(query)
    )
  }

  return {
    count: stickies.length,
    stickies,
  }
}

function addSticky(store: Store, args: Record<string, unknown>) {
  const color = args.color as string | undefined
  if (color !== undefined) {
    const colorError = validateColor(color)
    if (colorError) return colorError
  }

  const id = store.addSticky()
  const content = args.content as string | undefined

  if (content !== undefined) {
    store.updateSticky(id, content)
  }
  if (color !== undefined) {
    store.updateStickyColor(id, color)
  }

  const sticky = store.stickies.find((s) => s.id === id)
  if (!sticky) {
    return 'Error: Failed to create sticky.'
  }

  return { sticky }
}

function updateSticky(store: Store, args: Record<string, unknown>) {
  const id = args.id as string
  const sticky = requireSticky(store, id)
  if (typeof sticky === 'string') return sticky

  if (args.content !== undefined) {
    store.updateSticky(id, args.content as string)
  }

  if (args.color !== undefined) {
    const color = args.color as string
    const colorError = validateColor(color)
    if (colorError) return colorError
    store.updateStickyColor(id, color)
  }

  const updated = store.stickies.find((s) => s.id === id)
  if (!updated) {
    return `Error: Sticky with id "${id}" not found.`
  }

  return { sticky: updated }
}

function deleteSticky(store: Store, args: Record<string, unknown>) {
  const id = args.id as string
  const sticky = requireSticky(store, id)
  if (typeof sticky === 'string') return sticky

  store.deleteSticky(id)
  return { deleted: true, id }
}
