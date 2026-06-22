import { mkdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import fileUrl from 'licia/fileUrl'
import md5 from 'licia/md5'
import normalizePath from 'licia/normalizePath'
import type { ThumbnailResult } from '../common/types'
import {
  createSharpThumbnail,
  getCachedThumbnailDimensions,
  type ImageDimensions,
} from './imageProcessor'

const THUMB_MAX_WIDTH = 480
const THUMB_JPEG_QUALITY = 82
const CACHE_DIR = join(tmpdir(), 'tinker-photo-viewer-thumbs')

let queue: Promise<void> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

async function getCachePath(sourcePath: string): Promise<string> {
  const normalizedPath = normalizePath(sourcePath)
  const fileStats = await stat(normalizedPath)
  const key = md5(`${normalizedPath}:${fileStats.mtimeMs}:${fileStats.size}`)
  await mkdir(CACHE_DIR, { recursive: true })
  return join(CACHE_DIR, `${key}.jpg`)
}

export async function getThumbnailResult(
  sourcePath: string
): Promise<ThumbnailResult> {
  const normalizedPath = normalizePath(sourcePath)

  return enqueue(async () => {
    const cachePath = await getCachePath(normalizedPath)
    let dimensions: ImageDimensions | null = null
    let takenAt: number | undefined

    if (existsSync(cachePath)) {
      dimensions = await getCachedThumbnailDimensions(cachePath)
    } else {
      const result = await createSharpThumbnail(
        normalizedPath,
        cachePath,
        THUMB_MAX_WIDTH,
        THUMB_JPEG_QUALITY
      )
      dimensions = result.dimensions
      takenAt = result.takenAt
    }

    return {
      url: fileUrl(cachePath),
      width: dimensions?.width ?? 0,
      height: dimensions?.height ?? 0,
      takenAt,
    }
  })
}
