import { mkdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import fileUrl from 'licia/fileUrl'
import md5 from 'licia/md5'
import normalizePath from 'licia/normalizePath'
import splitPath from 'licia/splitPath'
import type { PreviewResult } from '../common/types'
import {
  createImagePreview,
  getCachedThumbnailDimensions,
} from './imageProcessor'

const PREVIEW_MAX_WIDTH = 2560
const PREVIEW_JPEG_QUALITY = 88
const CACHE_DIR = join(tmpdir(), 'tinker-photo-viewer-previews')

const NATIVE_PREVIEW_FORMATS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
])

const CONVERT_PREVIEW_FORMATS = new Set(['tiff', 'tif', 'bmp', 'svg'])

let queue: Promise<void> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function needsPreviewConversion(format: string): boolean {
  const normalized = format.toLowerCase()
  return (
    CONVERT_PREVIEW_FORMATS.has(normalized) ||
    !NATIVE_PREVIEW_FORMATS.has(normalized)
  )
}

function toFileUrl(filePath: string): string {
  return fileUrl(normalizePath(filePath))
}

async function getCachePath(sourcePath: string): Promise<string> {
  const normalizedPath = normalizePath(sourcePath)
  const fileStats = await stat(normalizedPath)
  const key = md5(
    `${normalizedPath}:${fileStats.mtimeMs}:${fileStats.size}:${PREVIEW_MAX_WIDTH}`
  )
  await mkdir(CACHE_DIR, { recursive: true })
  return join(CACHE_DIR, `${key}.jpg`)
}

export async function getPreviewResult(
  sourcePath: string
): Promise<PreviewResult> {
  const normalizedPath = normalizePath(sourcePath)
  const { ext } = splitPath(normalizedPath)
  const format = ext ? ext.slice(1).toLowerCase() : ''

  if (!needsPreviewConversion(format)) {
    return {
      url: toFileUrl(normalizedPath),
      width: 0,
      height: 0,
    }
  }

  return enqueue(async () => {
    const cachePath = await getCachePath(normalizedPath)
    let dimensions = existsSync(cachePath)
      ? await getCachedThumbnailDimensions(cachePath)
      : null

    if (!dimensions) {
      const result = await createImagePreview(
        normalizedPath,
        cachePath,
        PREVIEW_MAX_WIDTH,
        PREVIEW_JPEG_QUALITY
      )
      dimensions = result.dimensions
    }

    return {
      url: toFileUrl(cachePath),
      width: dimensions?.width ?? 0,
      height: dimensions?.height ?? 0,
    }
  })
}
