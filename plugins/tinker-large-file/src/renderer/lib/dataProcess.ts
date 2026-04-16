import fileSize from 'licia/fileSize'
import type { FileEntry } from '../types'
import { isDiskNodeDirectory } from 'share/lib/util'

const MIN_SIZE = fileSize('10M')

async function collectFiles(
  node: tinker.DiskUsageResult,
  parentPath: string,
  result: FileEntry[]
): Promise<void> {
  const path = parentPath ? `${parentPath}/${node.name}` : node.name

  if (await isDiskNodeDirectory(node, path)) {
    if (node.children) {
      await Promise.all(
        node.children.map((child) => collectFiles(child, path, result))
      )
    }
  } else if (node.size >= MIN_SIZE) {
    result.push({ name: node.name, path, size: node.size })
  }
}

export async function collectLargeFiles(
  raw: tinker.DiskUsageResult
): Promise<FileEntry[]> {
  const files: FileEntry[] = []
  await collectFiles(raw, '', files)
  files.sort((a, b) => b.size - a.size)
  return files
}
