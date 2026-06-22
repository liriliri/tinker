import { mkdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import md5 from 'licia/md5'
import normalizePath from 'licia/normalizePath'

const CACHE_DIR = join(tmpdir(), 'tinker-photo-viewer-thumbs')

async function getCachePath(sourcePath: string): Promise<string> {
  const normalizedPath = normalizePath(sourcePath)
  const fileStats = await stat(normalizedPath)
  const key = md5(`${normalizedPath}:${fileStats.mtimeMs}:${fileStats.size}`)
  await mkdir(CACHE_DIR, { recursive: true })
  return join(CACHE_DIR, `${key}.jpg`)
}

export async function resolveThumbnailCache(
  sourcePath: string
): Promise<{ cachePath: string; exists: boolean }> {
  const cachePath = await getCachePath(normalizePath(sourcePath))
  return {
    cachePath,
    exists: existsSync(cachePath),
  }
}
