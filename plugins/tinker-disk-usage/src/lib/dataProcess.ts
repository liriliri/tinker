import type { DiskItem } from '../types'

async function isDiskNodeDirectory(
  node: tinker.DiskUsageResult,
  fullPath: string
): Promise<boolean> {
  if (node.children && node.children.length > 0) return true

  try {
    const stat = await tinker.fstat(fullPath)
    return stat.isDirectory
  } catch {
    return false
  }
}

export async function buildDiskData(
  raw: tinker.DiskUsageResult
): Promise<DiskItem> {
  async function convert(
    node: tinker.DiskUsageResult,
    parentId: string
  ): Promise<DiskItem> {
    const id = parentId ? `${parentId}/${node.name}` : node.name
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

export function removeNodes(data: DiskItem, ids: Set<string>): void {
  if (data.children) {
    data.children = data.children.filter((c) => !ids.has(c.id))
    for (const child of data.children) {
      removeNodes(child, ids)
    }
  }
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
