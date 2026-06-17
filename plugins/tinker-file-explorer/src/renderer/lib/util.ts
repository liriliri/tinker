import type { TreeNodeData } from 'share/components/Tree'
import type {
  IFileEntry,
  IFavoritePlace,
  SortMethod,
  SortOrder,
} from '../../common/types'

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
  const drives = places.filter((place) => place.group === 'drives')

  return [
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
    {
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
    },
  ]
}
