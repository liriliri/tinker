import { stat } from 'fs/promises'
import splitPath from 'licia/splitPath'
import type { BookMeta } from '../common/types'

export async function readBookMeta(filePath: string): Promise<BookMeta> {
  const stats = await stat(filePath)
  const { name } = splitPath(filePath)
  return {
    path: filePath,
    title: name,
    fileSize: stats.size,
    mtime: stats.mtimeMs,
  }
}
