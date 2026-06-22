import { mkdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import fileUrl from 'licia/fileUrl'
import md5 from 'licia/md5'
import normalizePath from 'licia/normalizePath'
import splitPath from 'licia/splitPath'

const PREVIEW_MAX_WIDTH = 2560
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
      url: toFileUrl(normalizedPath),
    }
  }

  const cachePath = await getCachePath(normalizedPath)
  return {
    kind: 'convert',
    cachePath,
    exists: existsSync(cachePath),
  }
}
