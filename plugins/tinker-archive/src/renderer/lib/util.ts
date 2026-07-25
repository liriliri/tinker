import startWith from 'licia/startWith'
import endWith from 'licia/endWith'
import contain from 'licia/contain'
import filter from 'licia/filter'
import trim from 'licia/trim'
import lowerCase from 'licia/lowerCase'
import last from 'licia/last'
import compact from 'licia/compact'
import each from 'licia/each'
import map from 'licia/map'
import type { PathBarItem } from 'share/components/PathBar'
import type { IArchiveEntry, SortMethod, SortOrder } from '../../common/types'

/** File extensions that use ZIP as the container format. */
export const ZIP_BASED_EXTENSIONS = [
  'zip',
  'apk',
  'aab',
  'jar',
  'war',
  'ear',
  'ipa',
  'docx',
  'xlsx',
  'pptx',
  'docm',
  'xlsm',
  'pptm',
  'odt',
  'ods',
  'odp',
  'epub',
  'whl',
  'nupkg',
  'vsix',
] as const

export const ZIP_BASED_ACCEPT = map(
  ZIP_BASED_EXTENSIONS,
  (ext) => `.${ext}`
).join(',')

export function isZipBasedArchive(filePath: string): boolean {
  const name = lowerCase(filePath)
  const ext = last(name.split('.'))
  return !!ext && contain(ZIP_BASED_EXTENSIONS as readonly string[], ext)
}

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
