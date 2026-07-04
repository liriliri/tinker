import type { TabPaneContext } from '../types'

const contextGetters = new Map<string, () => TabPaneContext>()

export function registerTabContext(
  tabId: string,
  getter: () => TabPaneContext
) {
  contextGetters.set(tabId, getter)
}

export function unregisterTabContext(tabId: string) {
  contextGetters.delete(tabId)
}

export function getTabPaneContext(tabId: string): TabPaneContext | null {
  return contextGetters.get(tabId)?.() ?? null
}
