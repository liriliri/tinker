import type { IPageContext } from '../types'

const contextGetters = new Map<string, () => IPageContext>()

export function registerPageContext(tabId: string, getter: () => IPageContext) {
  contextGetters.set(tabId, getter)
}

export function unregisterPageContext(tabId: string) {
  contextGetters.delete(tabId)
}

export function getPageContext(tabId: string): IPageContext | null {
  return contextGetters.get(tabId)?.() ?? null
}
