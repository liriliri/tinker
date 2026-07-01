import { stat } from 'fs/promises'
import splitPath from 'licia/splitPath'
import { stripFileExt } from '../common/util'
import type { BookMeta } from '../common/types'

export async function readBookMeta(filePath: string): Promise<BookMeta> {
  const stats = await stat(filePath)
  const { name, ext } = splitPath(filePath)
  return {
    path: filePath,
    title: stripFileExt(name, ext),
    fileSize: stats.size,
    mtime: stats.mtimeMs,
  }
}
