import { readFile } from 'fs/promises'
import fs from 'fs-extra'
import { join } from 'path'
import { tmpdir } from 'os'
import { imageSize } from 'image-size'
import fileUrl from 'licia/fileUrl'
import md5 from 'licia/md5'
import normalizePath from 'licia/normalizePath'
import splitPath from 'licia/splitPath'
import type { PreviewResult, ThumbnailResult } from '../common/types'
import { PREVIEW_MAX_WIDTH } from '../common/imageConstants'
import { extractTakenAtFromFile } from './photo'

const CACHE_ROOT = join(tmpdir(), 'tinker-photo-viewer')

const NATIVE_PREVIEW_FORMATS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
])

const CONVERT_PREVIEW_FORMATS = new Set(['tiff', 'tif', 'bmp', 'svg'])

interface ImageDimensions {
  width: number
  height: number
}

async function readJpegDimensions(
  filePath: string
): Promise<ImageDimensions | null> {
  try {
    const buffer = await readFile(filePath)
    const { width, height } = imageSize(buffer)
    return width > 0 && height > 0 ? { width, height } : null
  } catch {
    return null
  }
}

async function resolveImageCachePath(
  subdir: 'previews' | 'thumbs',
  sourcePath: string,
  keySalt = ''
): Promise<{ cachePath: string; exists: boolean }> {
  const normalizedPath = normalizePath(sourcePath)
  const fileStats = await fs.stat(normalizedPath)
  const key = md5(
    `${normalizedPath}:${fileStats.mtimeMs}:${fileStats.size}${
      keySalt ? `:${keySalt}` : ''
    }`
  )
  const cacheDir = join(CACHE_ROOT, subdir)
  await fs.ensureDir(cacheDir)
  const cachePath = join(cacheDir, `${key}.jpg`)
  return {
    cachePath,
    exists: await fs.pathExists(cachePath),
  }
}

function needsPreviewConversion(format: string): boolean {
  const normalized = format.toLowerCase()
  return (
    CONVERT_PREVIEW_FORMATS.has(normalized) ||
    !NATIVE_PREVIEW_FORMATS.has(normalized)
  )
}

type PreviewRequest =
  | { kind: 'native'; url: string }
  | { kind: 'convert'; cachePath: string; exists: boolean }

export async function resolvePreviewRequest(
  sourcePath: string
): Promise<PreviewRequest> {
  const normalizedPath = normalizePath(sourcePath)
  const { ext } = splitPath(normalizedPath)
  const format = ext ? ext.slice(1).toLowerCase() : ''

  if (!needsPreviewConversion(format)) {
    return {
      kind: 'native',
      url: fileUrl(normalizedPath),
    }
  }

  const { cachePath, exists } = await resolveImageCachePath(
    'previews',
    normalizedPath,
    String(PREVIEW_MAX_WIDTH)
  )
  return {
    kind: 'convert',
    cachePath,
    exists,
  }
}

export async function resolveThumbnailCache(
  sourcePath: string
): Promise<{ cachePath: string; exists: boolean }> {
  return resolveImageCachePath('thumbs', normalizePath(sourcePath))
}

async function buildCachedImageResult(cachePath: string) {
  const dimensions = await readJpegDimensions(cachePath)
  return {
    url: fileUrl(normalizePath(cachePath)),
    width: dimensions?.width ?? 0,
    height: dimensions?.height ?? 0,
  }
}

export async function buildThumbnailResult(
  sourcePath: string,
  cachePath: string,
  readTakenAt: boolean
): Promise<ThumbnailResult> {
  const result = await buildCachedImageResult(cachePath)
  const takenAt = readTakenAt
    ? await extractTakenAtFromFile(sourcePath)
    : undefined
  return { ...result, takenAt }
}

export async function buildPreviewResult(
  cachePath: string
): Promise<PreviewResult> {
  return buildCachedImageResult(cachePath)
}
