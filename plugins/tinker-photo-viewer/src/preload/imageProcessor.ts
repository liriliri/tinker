import { readFile } from 'fs/promises'
import { imageSize } from 'image-size'
import fileUrl from 'licia/fileUrl'
import normalizePath from 'licia/normalizePath'
import type { PreviewResult, ThumbnailResult } from '../common/types'
import { extractTakenAtFromFile } from './exif'

export interface ImageDimensions {
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

export async function getCachedThumbnailDimensions(
  cachePath: string
): Promise<ImageDimensions | null> {
  return readJpegDimensions(cachePath)
}

export async function buildThumbnailResult(
  sourcePath: string,
  cachePath: string,
  readTakenAt: boolean
): Promise<ThumbnailResult> {
  const dimensions = await getCachedThumbnailDimensions(cachePath)
  const takenAt = readTakenAt
    ? await extractTakenAtFromFile(sourcePath)
    : undefined

  return {
    url: fileUrl(normalizePath(cachePath)),
    width: dimensions?.width ?? 0,
    height: dimensions?.height ?? 0,
    takenAt,
  }
}

export async function buildPreviewResult(
  cachePath: string
): Promise<PreviewResult> {
  const dimensions = await getCachedThumbnailDimensions(cachePath)

  return {
    url: fileUrl(normalizePath(cachePath)),
    width: dimensions?.width ?? 0,
    height: dimensions?.height ?? 0,
  }
}
