import type { MenuItemConstructorOptions } from 'electron'
import { prompt } from 'share/components/Prompt'
import map from 'licia/map'
import contain from 'licia/contain'
import findIdx from 'licia/findIdx'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import type { SortMethod } from '../../common/types'
import type { Store } from '../store'

interface EntryContextMenuHandlers {
  onExtract: () => void
  onDelete: () => void
}

interface BlankContextMenuOptions {
  onAddFiles: () => void
  onCreateFolder: (name: string) => Promise<void>
  onExtractAll: () => void
}

const SORT_OPTIONS: Array<{ method: SortMethod; labelKey: string }> = [
  { method: 'name', labelKey: 'colName' },
  { method: 'size', labelKey: 'colSize' },
  { method: 'mtime', labelKey: 'colModified' },
]

function buildSortSubmenu(
  store: Store,
  t: (key: string) => string
): MenuItemConstructorOptions[] {
  return map(SORT_OPTIONS, ({ method, labelKey }) => {
    const active = store.sortMethod === method
    const orderMark = store.sortOrder === 'asc' ? ' ↑' : ' ↓'

    return {
      label: `${t(labelKey)}${active ? orderMark : ''}`,
      click: () => {
        if (store.sortMethod === method) {
          store.setSort(method)
          return
        }
        store.setSort(method, 'asc')
      },
    }
  })
}

export async function promptCreateFolder(
  t: (key: string) => string,
  onCreate: (name: string) => Promise<void>
) {
  const name = await prompt({
    title: t('newFolder'),
    placeholder: t('newFolderPlaceholder'),
  })
  if (!name || isStrBlank(name)) return
  await onCreate(trim(name))
}

export function showBlankContextMenu(
  event: MouseEvent,
  store: Store,
  t: (key: string) => string,
  options: BlankContextMenuOptions
) {
  event.preventDefault()

  tinker.showContextMenu(event.clientX, event.clientY, [
    {
      label: t('addFiles'),
      click: () => options.onAddFiles(),
    },
    {
      label: t('newFolder'),
      click: () => {
        void promptCreateFolder(t, options.onCreateFolder)
      },
    },
    { type: 'separator' },
    {
      label: t('extractAll'),
      click: () => options.onExtractAll(),
    },
    { type: 'separator' },
    {
      label: t('sortBy'),
      submenu: buildSortSubmenu(store, t),
    },
  ])
}

export function showEntryContextMenu(
  event: MouseEvent,
  store: Store,
  clickedPath: string,
  t: (key: string) => string,
  handlers: EntryContextMenuHandlers
) {
  event.preventDefault()

  let paths = store.selectedPaths
  if (!contain(paths, clickedPath)) {
    const index = findIdx(
      store.visibleEntries,
      (entry) => entry.path === clickedPath
    )
    if (index < 0) return
    store.selectSingle(clickedPath, index)
    paths = [clickedPath]
  }

  if (isEmpty(paths)) return

  tinker.showContextMenu(event.clientX, event.clientY, [
    {
      label: t('extract'),
      click: () => handlers.onExtract(),
    },
    { type: 'separator' },
    {
      label: t('delete'),
      click: () => handlers.onDelete(),
    },
    { type: 'separator' },
    {
      label: t('sortBy'),
      submenu: buildSortSubmenu(store, t),
    },
  ])
}
