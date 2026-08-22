import LocalStore from 'licia/LocalStore'
import isObj from 'licia/isObj'
import type { LayoutStorage } from 'react-resizable-panels'

const STORAGE_PANEL_LAYOUTS = 'panelLayouts'

export const storage = new LocalStore('tinker-browser')

export const panelLayoutStorage: LayoutStorage = {
  getItem(storageKey: string) {
    const layouts = storage.get(STORAGE_PANEL_LAYOUTS)
    if (!isObj(layouts)) return null
    return (layouts as Record<string, string>)[storageKey] ?? null
  },
  setItem(storageKey: string, value: string) {
    const existing = storage.get(STORAGE_PANEL_LAYOUTS)
    const layouts = isObj(existing)
      ? { ...(existing as Record<string, string>) }
      : {}
    layouts[storageKey] = value
    storage.set(STORAGE_PANEL_LAYOUTS, layouts)
  },
}
