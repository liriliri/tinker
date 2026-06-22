import { readFile } from 'fs/promises'
import heicConvert from 'heic-convert'
import splitPath from 'licia/splitPath'
import sharp, { type Metadata } from 'sharp'
import { extractTakenAt } from './exif'

const HEIC_FORMATS = new Set(['heic', 'heif', 'hif'])

export function isHeicFormat(format: string): boolean {
  return HEIC_FORMATS.has(format.toLowerCase())
}

async function convertHeicToJpeg(heicBuffer: Buffer): Promise<Buffer> {
  const jpegBuffer = await heicConvert({
    buffer: heicBuffer,
    format: 'JPEG',
    quality: 0.95,
  })

  return Buffer.from(jpegBuffer)
}

export async function preprocessImageBuffer(
  buffer: Buffer,
  format: string
): Promise<Buffer> {
  if (isHeicFormat(format)) {
    return convertHeicToJpeg(buffer)
  }

  return buffer
}

export async function readProcessedImageBuffer(
  filePath: string,
  format: string
): Promise<Buffer> {
  const rawBuffer = await readFile(filePath)
  return preprocessImageBuffer(rawBuffer, format)
}

export interface ImageDimensions {
  width: number
  height: number
}

function normalizeDimensions(metadata: Metadata): ImageDimensions | null {
  if (!metadata.width || !metadata.height) {
    return null
  }

  let { width, height } = metadata
  const { orientation } = metadata
  if (
    orientation === 5 ||
    orientation === 6 ||
    orientation === 7 ||
    orientation === 8
  ) {
    ;[width, height] = [height, width]
  }

  return { width, height }
}

export async function getImageDimensions(
  imageBuffer: Buffer
): Promise<ImageDimensions | null> {
  const metadata = await sharp(imageBuffer).rotate().metadata()
  return normalizeDimensions(metadata)
}

export async function getImageDimensionsFromPath(
  filePath: string
): Promise<ImageDimensions | null> {
  const { ext } = splitPath(filePath)
  const format = ext ? ext.slice(1).toLowerCase() : ''
  const imageBuffer = await readProcessedImageBuffer(filePath, format)
  return getImageDimensions(imageBuffer)
}

export interface ThumbnailOutput {
  dimensions: ImageDimensions | null
  takenAt?: number
}

export async function createSharpThumbnail(
  sourcePath: string,
  cachePath: string,
  maxWidth: number,
  jpegQuality: number
): Promise<ThumbnailOutput> {
  const { ext } = splitPath(sourcePath)
  const format = ext ? ext.slice(1).toLowerCase() : ''
  const imageBuffer = await readProcessedImageBuffer(sourcePath, format)
  const takenAt = extractTakenAt(imageBuffer)

  const pipeline = sharp(imageBuffer).rotate()
  const metadata = await pipeline.metadata()
  await pipeline
    .clone()
    .resize(maxWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: jpegQuality })
    .toFile(cachePath)

  return {
    dimensions: normalizeDimensions(metadata),
    takenAt,
  }
}

export async function createSharpPreview(
  sourcePath: string,
  cachePath: string,
  maxWidth: number,
  jpegQuality: number
): Promise<ThumbnailOutput> {
  const { ext } = splitPath(sourcePath)
  const format = ext ? ext.slice(1).toLowerCase() : ''
  const imageBuffer = await readProcessedImageBuffer(sourcePath, format)

  const pipeline = sharp(imageBuffer).rotate()
  const metadata = await pipeline.metadata()
  await pipeline
    .clone()
    .resize(maxWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: jpegQuality })
    .toFile(cachePath)

  return {
    dimensions: normalizeDimensions(metadata),
  }
}

export async function getCachedThumbnailDimensions(
  cachePath: string
): Promise<ImageDimensions | null> {
  try {
    const buffer = await readFile(cachePath)
    return getImageDimensions(buffer)
  } catch {
    return null
  }
}
