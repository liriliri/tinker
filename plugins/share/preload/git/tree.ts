import path from 'path'
import mime from 'licia/mime'
import type { CommitTreeEntry } from '../../types/git'
import { exec, execRaw, requireRepo } from './core'

export async function getCommitTree(
  sha: string,
  dirPath = ''
): Promise<CommitTreeEntry[]> {
  const currentPath = requireRepo()

  const target = dirPath ? `${sha}:${dirPath}` : sha
  const { stdout } = await exec(['ls-tree', '--full-tree', target], currentPath)

  const output = stdout.trim()
  if (!output) return []

  const result: CommitTreeEntry[] = []

  for (const line of output.split('\n')) {
    if (!line) continue
    const tabIdx = line.lastIndexOf('\t')
    if (tabIdx === -1) continue

    const info = line.slice(0, tabIdx)
    const name = line.slice(tabIdx + 1)
    const parts = info.split(' ')
    const type = parts[1] // 'tree' or 'blob'

    result.push({
      name,
      path: dirPath ? `${dirPath}/${name}` : name,
      isDirectory: type === 'tree',
    })
  }

  result.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return result
}

export async function getCommitFileContent(
  sha: string,
  filePath: string
): Promise<string> {
  const currentPath = requireRepo()
  const { stdout } = await exec(['show', `${sha}:${filePath}`], currentPath)
  return stdout.replace(/\n$/, '')
}

export async function getCommitFileContentBinary(
  sha: string,
  filePath: string
): Promise<string> {
  const currentPath = requireRepo()
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mimeType = (mime(ext) as string) || 'application/octet-stream'
  const buffer = await execRaw(['show', `${sha}:${filePath}`], currentPath)
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}
