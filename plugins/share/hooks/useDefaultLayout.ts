import isObj from 'licia/isObj'
import {
  useDefaultLayout as useLibraryDefaultLayout,
  type LayoutStorage,
} from 'react-resizable-panels'
import { storage } from 'share/store/Base'

const STORAGE_PANEL_LAYOUTS = 'panelLayouts'

const panelLayoutStorage: LayoutStorage = {
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

export interface UseDefaultLayoutOptions {
  /** Defaults to `'layout'`. Pass a distinct id when multiple groups share the same panelIds. */
  id?: string
  panelIds?: string[]
  debounceSaveMs?: number
  onlySaveAfterUserInteractions?: boolean
  storage?: LayoutStorage
}

/** Like react-resizable-panels `useDefaultLayout`, defaulting to plugin BaseStore storage. */
export function useDefaultLayout(options: UseDefaultLayoutOptions) {
  const { id = 'layout', storage: customStorage, ...rest } = options
  return useLibraryDefaultLayout({
    ...rest,
    id,
    storage: customStorage ?? panelLayoutStorage,
  })
}
