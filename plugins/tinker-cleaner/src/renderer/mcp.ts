import isUndef from 'licia/isUndef'
import waitUntil from 'licia/waitUntil'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../../package.json'

interface CleanArgs {
  ids: string[]
  moveToTrash?: boolean
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    scan,
    get: (store) => getResults(store),
    clean,
  })
}

function serializeResults(store: Store) {
  return {
    scanning: store.scanning,
    cleaning: store.cleaning,
    moveToTrash: store.moveToTrash,
    totalScannedSize: store.totalScannedSize,
    selectedCount: store.selectedCount,
    selectedSize: store.selectedSize,
    rules: store.visibleRules.map((rule) => ({
      id: rule.id,
      category: rule.category,
      nameKey: rule.nameKey,
      path: rule.path,
      size: rule.size,
      selected: store.selectedRules.has(rule.id),
    })),
  }
}

async function waitForIdle(store: Store) {
  if (store.scanning || store.cleaning) {
    await waitUntil(() => !store.scanning && !store.cleaning, 120000)
  }
}

async function getResults(store: Store) {
  await waitForIdle(store)
  return serializeResults(store)
}

async function scan(store: Store) {
  await waitForIdle(store)
  await store.scan()
  return serializeResults(store)
}

async function clean(store: Store, args: CleanArgs) {
  await waitForIdle(store)

  if (store.view !== 'result') {
    throw new Error('No scan results. Call scan first.')
  }

  const ruleById = new Map(store.rules.map((rule) => [rule.id, rule]))
  const ids = args.ids

  for (const id of ids) {
    const rule = ruleById.get(id)
    if (!rule) {
      throw new Error(`Rule with id "${id}" not found.`)
    }
    if (!rule.scanned || rule.size <= 0) {
      throw new Error(
        `Rule "${id}" has nothing to clean. Call scan first and use ids with size > 0.`
      )
    }
  }

  if (!isUndef(args.moveToTrash)) {
    store.setMoveToTrash(args.moveToTrash)
  }

  store.selectedRules = new Set(ids)

  const result = await store.clean()
  await store.scan()

  return {
    cleaned: result.cleaned,
    errors: result.errors,
    ...serializeResults(store),
  }
}
