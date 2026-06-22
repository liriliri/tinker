import { readFile } from 'fs/promises'
import { imageSize } from 'image-size'
import { extractTakenAtFromFile } from './exif'
import { buildJpegScaleArgs, runFfmpeg } from './ffmpegImage'

export interface ImageDimensions {
  width: number
  height: number
}

export interface ThumbnailOutput {
  dimensions: ImageDimensions | null
  takenAt?: number
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

export async function createImageThumbnail(
  sourcePath: string,
  cachePath: string,
  maxWidth: number,
  jpegQuality: number
): Promise<ThumbnailOutput> {
  const takenAt = await extractTakenAtFromFile(sourcePath)

  await runFfmpeg(
    buildJpegScaleArgs(sourcePath, cachePath, maxWidth, jpegQuality)
  )

  return {
    dimensions: await readJpegDimensions(cachePath),
    takenAt,
  }
}

export async function createImagePreview(
  sourcePath: string,
  cachePath: string,
  maxWidth: number,
  jpegQuality: number
): Promise<ThumbnailOutput> {
  await runFfmpeg(
    buildJpegScaleArgs(sourcePath, cachePath, maxWidth, jpegQuality)
  )

  return {
    dimensions: await readJpegDimensions(cachePath),
  }
}

export async function getCachedThumbnailDimensions(
  cachePath: string
): Promise<ImageDimensions | null> {
  try {
    const buffer = await readFile(cachePath)
    const { width, height } = imageSize(buffer)
    return width > 0 && height > 0 ? { width, height } : null
  } catch {
    return null
  }
}
