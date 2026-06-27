import clamp from 'licia/clamp'
import type { IFileEntry, SortMethod, SortOrder } from '../../common/types'

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

export interface PathBreadcrumbItem {
  name: string
  path: string
}

export function buildRemotePathBreadcrumbs(
  filePath: string
): PathBreadcrumbItem[] {
  if (!filePath || filePath === '.') {
    return [{ name: '.', path: '.' }]
  }

  const normalized = filePath.replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)
  const items: PathBreadcrumbItem[] = []

  if (normalized.startsWith('/')) {
    items.push({ name: '/', path: '/' })
    let current = '/'
    for (const part of parts) {
      current = sftp.joinRemotePath(current, part)
      items.push({ name: part, path: current })
    }
  } else {
    let current = ''
    for (const part of parts) {
      current = current ? sftp.joinRemotePath(current, part) : part
      items.push({ name: part, path: current })
    }
  }

  return items
}

export function getVisiblePathBreadcrumbs(
  items: PathBreadcrumbItem[],
  startIndex: number
): { ellipsisPath: string | null; visible: PathBreadcrumbItem[] } {
  const start = clamp(startIndex, 0, items.length - 1)
  if (start === 0) {
    return { ellipsisPath: null, visible: items }
  }

  return {
    ellipsisPath: items[start - 1]?.path ?? null,
    visible: items.slice(start),
  }
}
