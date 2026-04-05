import type { FileEntry, DuplicateGroup } from '../../common/types'

const MIN_SIZE = 200 * 1024

function collectFiles(
  node: tinker.DiskUsageResult,
  parentPath: string,
  result: FileEntry[]
): void {
  const path = parentPath ? `${parentPath}/${node.name}` : node.name

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      collectFiles(child, path, result)
    }
  } else if (node.size >= MIN_SIZE) {
    result.push({ name: node.name, path, size: node.size })
  }
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const group = map.get(key)
    if (group) {
      group.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return map
}

async function verifyByMD5(entries: FileEntry[]): Promise<DuplicateGroup[]> {
  const results = await Promise.all(
    entries.map(async (entry) => {
      try {
        entry.md5 = await duplicateCleaner.calculateMD5(entry.path, entry.size)
        return entry
      } catch {
        return null
      }
    })
  )

  const valid = results.filter((e): e is FileEntry => e !== null && !!e.md5)
  const md5Map = groupBy(valid, (e) => e.md5!)

  const groups: DuplicateGroup[] = []
  for (const [, files] of md5Map) {
    if (files.length >= 2) {
      groups.push({ size: files[0].size, files })
    }
  }

  return groups
}

export async function findDuplicates(
  raw: tinker.DiskUsageResult
): Promise<DuplicateGroup[]> {
  const files: FileEntry[] = []
  collectFiles(raw, '', files)

  const sizeMap = groupBy(files, (f) => String(f.size))

  const allVerified = await Promise.all(
    Array.from(sizeMap.values())
      .filter((entries) => entries.length >= 2)
      .map((entries) => verifyByMD5(entries))
  )

  const groups = allVerified.flat()

  groups.sort((a, b) => b.size - a.size)

  return groups
}
