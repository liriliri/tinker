import type { TreeNodeData } from 'share/components/Tree'
import type { PathBarItem } from 'share/components/PathBar'
import type {
  IFileEntry,
  IFavoritePlace,
  SortMethod,
  SortOrder,
} from '../../common/types'

export function isHiddenEntry(name: string): boolean {
  return name.startsWith('.')
}

export function filterEntries(
  entries: IFileEntry[],
  query: string,
  showHidden = false
): IFileEntry[] {
  let result = entries
  if (!showHidden) {
    result = result.filter((entry) => !isHiddenEntry(entry.name))
  }

  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return result
  return result.filter((entry) => entry.name.toLowerCase().includes(trimmed))
}

export function sortEntries(
  entries: IFileEntry[],
  method: SortMethod,
  order: SortOrder
): IFileEntry[] {
  const dirs = entries.filter((e) => e.isDirectory)
  const files = entries.filter((e) => !e.isDirectory)

  const compare = (a: IFileEntry, b: IFileEntry): number => {
    let result = 0
    if (method === 'name') {
      result = a.name.localeCompare(b.name)
    } else if (method === 'size') {
      result = a.size - b.size
    } else {
      result = a.mtimeMs - b.mtimeMs
    }
    return order === 'asc' ? result : -result
  }

  dirs.sort(compare)
  files.sort(compare)
  return [...dirs, ...files]
}

export interface SidebarNodeData extends TreeNodeData {
  id: string
  label: string
  kind: 'section' | 'place'
  path?: string
  placeGroup?: IFavoritePlace['group']
  labelKey?: string
  children?: SidebarNodeData[]
}

export function buildSidebarTree(
  places: IFavoritePlace[],
  t: (key: string) => string
): SidebarNodeData[] {
  const shortcuts = places.filter((place) => place.group === 'shortcuts')
  const custom = places.filter((place) => place.group === 'custom')
  const drives = places.filter((place) => place.group === 'drives')

  const sections: SidebarNodeData[] = [
    {
      id: 'section-custom',
      label: t('custom'),
      kind: 'section',
      children: custom.map((place) => ({
        id: place.id,
        label: place.label,
        kind: 'place',
        path: place.path,
        placeGroup: place.group,
      })),
    },
    {
      id: 'section-shortcuts',
      label: t('shortcuts'),
      kind: 'section',
      children: shortcuts.map((place) => ({
        id: place.id,
        label: t(place.label),
        kind: 'place',
        path: place.path,
        placeGroup: place.group,
        labelKey: place.label,
      })),
    },
  ]

  sections.push({
    id: 'section-drives',
    label: t('drives'),
    kind: 'section',
    children: drives.map((place) => ({
      id: place.id,
      label: place.label,
      kind: 'place',
      path: place.path,
      placeGroup: place.group,
    })),
  })

  return sections
}

const WIN_DRIVE_RE = /^([A-Za-z]:)(?:[/\\]|$)/

export function buildPathBreadcrumbs(filePath: string): PathBarItem[] {
  if (!filePath) return []

  const items: PathBarItem[] = []

  if (WIN_DRIVE_RE.test(filePath)) {
    const match = WIN_DRIVE_RE.exec(filePath)!
    const driveRoot = `${match[1]}\\`
    const rest = filePath.slice(match[0].length)
    const parts = rest.split(/[/\\]/).filter(Boolean)

    items.push({ name: match[1], path: driveRoot })
    let current = driveRoot
    for (const part of parts) {
      current = fileExplorer.joinPath(current, part)
      items.push({ name: part, path: current })
    }
  } else if (filePath.startsWith('/')) {
    const parts = filePath.split('/').filter(Boolean)

    items.push({ name: '/', path: '/' })
    let current = '/'
    for (const part of parts) {
      current = fileExplorer.joinPath(current, part)
      items.push({ name: part, path: current })
    }
  } else {
    const parts = filePath.split(/[/\\]/).filter(Boolean)
    let current = ''
    for (let i = 0; i < parts.length; i++) {
      current = i === 0 ? parts[i] : fileExplorer.joinPath(current, parts[i])
      items.push({ name: parts[i], path: current })
    }
  }

  return items
}
