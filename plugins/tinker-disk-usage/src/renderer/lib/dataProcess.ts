import type { DiskItem } from '../../common/types'

export function buildDiskData(raw: tinker.DiskUsageResult): DiskItem {
  function convert(node: tinker.DiskUsageResult, parentId: string): DiskItem {
    const id = parentId ? `${parentId}/${node.name}` : node.name
    const isDirectory = node.children && node.children.length > 0

    const item: DiskItem = {
      id,
      name: node.name,
      size: node.size,
      isDirectory: !!isDirectory,
    }

    if (isDirectory) {
      item.children = node.children.map((child) => convert(child, id))
      item.loaded = true
    }

    return item
  }

  return convert(raw, '')
}

export function collectLeafPaths(data: DiskItem): string[] {
  const paths: string[] = []

  function walk(node: DiskItem) {
    if (!node.children || node.children.length === 0) {
      if (!node.loaded && node.size > 0) {
        paths.push(node.id)
      }
      return
    }
    for (const child of node.children) {
      walk(child)
    }
  }

  walk(data)
  return paths
}

export function applyDirectoryFlags(
  data: DiskItem,
  dirMap: Record<string, boolean>
): void {
  function walk(node: DiskItem) {
    if (!node.loaded && node.id in dirMap) {
      node.isDirectory = dirMap[node.id]
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child)
      }
    }
  }

  walk(data)
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
