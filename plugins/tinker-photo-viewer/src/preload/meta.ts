import { open, stat } from 'fs/promises'
import splitPath from 'licia/splitPath'
import normalizePath from 'licia/normalizePath'
import type { PhotoMeta } from '../common/types'
import { parseExifBuffer, readExifFromSharp } from './exif'
import { readImageSize } from './imageSize'

const META_READ_BYTES = 512 * 1024

async function readFileHeader(
  filePath: string,
  maxBytes: number
): Promise<Buffer> {
  const handle = await open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(maxBytes)
    const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0)
    return Buffer.from(buffer.subarray(0, bytesRead))
  } finally {
    await handle.close()
  }
}

async function resolveExif(
  filePath: string,
  headerBuffer: Buffer
): Promise<PhotoMeta['exif']> {
  const fromHeader = parseExifBuffer(headerBuffer)
  if (fromHeader?.takenAt) return fromHeader

  const fromSharp = await readExifFromSharp(filePath)
  if (fromSharp) {
    return { ...fromHeader, ...fromSharp }
  }

  return fromHeader
}

export async function readPhotoMeta(filePath: string): Promise<PhotoMeta> {
  const normalizedPath = normalizePath(filePath)
  const { ext } = splitPath(normalizedPath)
  const format = ext ? ext.slice(1).toLowerCase() : ''
  const fileStats = await stat(normalizedPath)

  let headerBuffer: Buffer
  try {
    headerBuffer = await readFileHeader(normalizedPath, META_READ_BYTES)
  } catch {
    headerBuffer = Buffer.alloc(0)
  }

  const dimensions = readImageSize(headerBuffer, format)
  const exif = await resolveExif(normalizedPath, headerBuffer)
  const createdAt = exif?.takenAt ?? fileStats.mtimeMs

  return {
    path: normalizedPath,
    size: fileStats.size,
    width: dimensions?.width ?? 0,
    height: dimensions?.height ?? 0,
    createdAt,
    updatedAt: fileStats.mtimeMs,
    format: format.toUpperCase() || 'UNKNOWN',
    exif,
  }
}
