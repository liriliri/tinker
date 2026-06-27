import type { MenuItemConstructorOptions } from 'electron'
import { prompt } from 'share/components/Prompt'
import type { SortMethod } from '../../common/types'
import type Explorer from '../store/Explorer'

interface EntryContextMenuHandlers {
  onRename: (path: string, newName: string) => Promise<void>
  onDelete: (paths: string[]) => void
  onDownload?: () => void
}

interface BlankContextMenuOptions {
  onCreateFolder: (name: string) => Promise<void>
}

const SORT_OPTIONS: Array<{ method: SortMethod; labelKey: string }> = [
  { method: 'name', labelKey: 'colName' },
  { method: 'size', labelKey: 'colSize' },
  { method: 'mtime', labelKey: 'colModified' },
]

function buildSortSubmenu(
  tab: Explorer,
  t: (key: string) => string
): MenuItemConstructorOptions[] {
  return SORT_OPTIONS.map(({ method, labelKey }) => {
    const active = tab.sortMethod === method
    const orderMark = tab.sortOrder === 'asc' ? ' ↑' : ' ↓'

    return {
      label: `${t(labelKey)}${active ? orderMark : ''}`,
      click: () => {
        if (tab.sortMethod === method) {
          tab.setSort(method)
          return
        }
        tab.setSort(method, 'asc')
      },
    }
  })
}

async function requestCreateFolder(
  t: (key: string) => string,
  onCreate: (name: string) => Promise<void>
) {
  const name = await prompt({
    title: t('newFolder'),
    placeholder: t('newFolderPlaceholder'),
  })
  if (!name?.trim()) return
  await onCreate(name.trim())
}

export function showBlankContextMenu(
  event: MouseEvent,
  tab: Explorer,
  t: (key: string) => string,
  options: BlankContextMenuOptions
) {
  event.preventDefault()

  tinker.showContextMenu(event.clientX, event.clientY, [
    {
      label: t('newFolder'),
      click: () => {
        void requestCreateFolder(t, options.onCreateFolder)
      },
    },
    { type: 'separator' },
    {
      label: t('sortBy'),
      submenu: buildSortSubmenu(tab, t),
    },
  ])
}

export function showEntryContextMenu(
  event: MouseEvent,
  tab: Explorer,
  clickedPath: string,
  t: (key: string) => string,
  handlers: EntryContextMenuHandlers
) {
  event.preventDefault()

  let paths = tab.selectedPaths
  if (!paths.includes(clickedPath)) {
    const index = tab.visibleEntries.findIndex(
      (entry) => entry.path === clickedPath
    )
    if (index < 0) return
    tab.selectSingle(clickedPath, index)
    paths = [clickedPath]
  }

  if (paths.length === 0) return

  const items: MenuItemConstructorOptions[] = []

  if (handlers.onDownload) {
    items.push({
      label: t('download'),
      click: () => handlers.onDownload?.(),
    })
    items.push({ type: 'separator' })
  }

  items.push(
    {
      label: t('rename'),
      enabled: paths.length === 1,
      click: () => {
        void requestRename(paths[0], t, handlers.onRename)
      },
    },
    { type: 'separator' },
    {
      label: t('delete'),
      click: () => handlers.onDelete([...paths]),
    },
    { type: 'separator' },
    {
      label: t('sortBy'),
      submenu: buildSortSubmenu(tab, t),
    }
  )

  tinker.showContextMenu(event.clientX, event.clientY, items)
}

async function requestRename(
  path: string,
  t: (key: string) => string,
  onRename: (path: string, newName: string) => Promise<void>
) {
  const oldName = sftp.basename(path)
  const newName = await prompt({
    title: t('rename'),
    defaultValue: oldName,
    placeholder: t('renamePlaceholder'),
  })

  if (!newName?.trim() || newName.trim() === oldName) return
  await onRename(path, newName.trim())
}
