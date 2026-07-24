import startWith from 'licia/startWith'
import endWith from 'licia/endWith'
import contain from 'licia/contain'
import filter from 'licia/filter'
import trim from 'licia/trim'
import lowerCase from 'licia/lowerCase'
import compact from 'licia/compact'
import each from 'licia/each'
import type { PathBarItem } from 'share/components/PathBar'
import type { IArchiveEntry, SortMethod, SortOrder } from '../../common/types'

function isHiddenEntry(name: string): boolean {
  return startWith(name, '.')
}

export function filterEntries(
  entries: IArchiveEntry[],
  query: string,
  showHidden = false
): IArchiveEntry[] {
  let result = entries
  if (!showHidden) {
    result = filter(result, (entry) => !isHiddenEntry(entry.name))
  }

  const trimmed = lowerCase(trim(query))
  if (!trimmed) return result
  return filter(result, (entry) => contain(lowerCase(entry.name), trimmed))
}

export function sortEntries(
  entries: IArchiveEntry[],
  method: SortMethod,
  order: SortOrder
): IArchiveEntry[] {
  const dirs = filter(entries, (entry) => entry.isDirectory)
  const files = filter(entries, (entry) => !entry.isDirectory)

  const compare = (a: IArchiveEntry, b: IArchiveEntry): number => {
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

export function buildPathBreadcrumbs(
  archiveName: string,
  currentPath: string
): PathBarItem[] {
  const items: PathBarItem[] = [{ name: archiveName, path: '' }]
  if (!currentPath) return items

  const parts = compact(currentPath.split('/'))
  let current = ''
  each(parts, (part) => {
    current = `${current}${part}/`
    items.push({ name: part, path: current })
  })
  return items
}

export function joinZipPath(dirPath: string, name: string): string {
  const prefix = dirPath
    ? endWith(dirPath, '/')
      ? dirPath
      : `${dirPath}/`
    : ''
  return `${prefix}${name}`
}
