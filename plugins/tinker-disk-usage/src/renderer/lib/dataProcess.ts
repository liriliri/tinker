import type { DiskItem } from '../types'
import { isDiskNodeDirectory, joinPath } from 'share/lib/util'

export async function buildDiskData(
  raw: tinker.DiskUsageResult
): Promise<DiskItem> {
  async function convert(
    node: tinker.DiskUsageResult,
    parentId: string
  ): Promise<DiskItem> {
    const id = joinPath(parentId, node.name)
    const isDirectory = await isDiskNodeDirectory(node, id)

    const item: DiskItem = {
      id,
      name: node.name,
      size: node.size,
      isDirectory,
    }

    if (isDirectory && node.children && node.children.length > 0) {
      item.children = await Promise.all(
        node.children.map((child) => convert(child, id))
      )
      item.loaded = true
    }

    return item
  }

  return convert(raw, '')
}

export function findBranch(id: string, data: DiskItem): DiskItem | undefined {
  if (data.id === id) return data
  if (data.children) {
    for (const child of data.children) {
      const found = findBranch(id, child)
      if (found) return found
    }
  }
  return undefined
}

export function findParentId(id: string, data: DiskItem): string | undefined {
  if (!data.children) return undefined

  for (const child of data.children) {
    if (child.id === id) {
      return data.id
    }

    const found = findParentId(id, child)
    if (found !== undefined) {
      return found
    }
  }

  return undefined
}

export function removeNodes(data: DiskItem, ids: Set<string>): number {
  if (!data.children) return 0

  let removedSize = 0
  const remaining: DiskItem[] = []

  for (const child of data.children) {
    if (ids.has(child.id)) {
      removedSize += child.size
    } else {
      removedSize += removeNodes(child, ids)
      remaining.push(child)
    }
  }

  data.children = remaining
  data.size -= removedSize
  return removedSize
}

export function collectUnloadedLeafDirs(node: DiskItem): DiskItem[] {
  const result: DiskItem[] = []

  if (node.children) {
    for (const child of node.children) {
      if (child.isDirectory && !child.loaded) {
        result.push(child)
      } else if (child.children) {
        result.push(...collectUnloadedLeafDirs(child))
      }
    }
  }

  return result
}

export function mergeBranch(
  tree: DiskItem,
  id: string,
  newData: DiskItem
): void {
  const node = findBranch(id, tree)
  if (node) {
    node.children = newData.children
    node.loaded = newData.loaded
    node.isDirectory = newData.isDirectory
  }
}
