import durationFormat from 'licia/durationFormat'
import dateFormat from 'licia/dateFormat'
import compact from 'licia/compact'
import splitPath from 'licia/splitPath'
import isWindows from 'licia/isWindows'
import { EXECUTABLE_EXTS } from './fileType'

const sep = isWindows ? '\\' : '/'

export function joinPath(...parts: string[]): string {
  return compact(parts).join(sep)
}

/**
 * Open an image file using native dialog and return File with path
 */
export async function openImageFile(options?: {
  title?: string
  extensions?: string[]
}): Promise<{ file: File; filePath: string } | null> {
  const {
    title = 'Open Image',
    extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'],
  } = options || {}

  const result = await tinker.showOpenDialog({
    title,
    filters: [{ name: 'Images', extensions }],
    properties: ['openFile'],
  })

  if (result.canceled || !result.filePaths[0]) return null

  try {
    const filePath = result.filePaths[0]
    const buffer = await tinker.readFile(filePath)
    const fileName = filePath.split('/').pop() || 'image.png'
    const ext = fileName.split('.').pop()?.toLowerCase() || 'png'
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
    const blob = new Blob([buffer], { type: mimeType })
    const file = new File([blob], fileName, { type: mimeType })
    return { file, filePath }
  } catch (error) {
    console.error('Failed to load image:', error)
    return null
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await tinker.fstat(filePath)
    return true
  } catch {
    return false
  }
}

export async function isDiskNodeDirectory(
  node: tinker.DiskUsageResult,
  fullPath: string
): Promise<boolean> {
  if (node.children && node.children.length > 0) return true

  try {
    const stat = await tinker.fstat(fullPath)
    return stat.isDirectory
  } catch {
    return false
  }
}

export async function resolveSavePath(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) return filePath

  const { dir, name, ext } = splitPath(filePath)
  const base = `${dir}${name.slice(0, name.length - ext.length)}`

  const hourPath = `${base}-${dateFormat('yyyymmddHH')}${ext}`
  if (!(await fileExists(hourPath))) return hourPath

  return `${base}-${dateFormat('yyyymmddHHMM')}${ext}`
}

const fileIconCache = new Map<string, Promise<string | undefined>>()

function getFileIconCacheKey(filePath: string): string {
  const { ext } = splitPath(filePath)
  const lowerExt = ext.toLowerCase()
  const extKey = lowerExt.replace(/^\./, '')

  if (!extKey || EXECUTABLE_EXTS.has(extKey)) {
    return filePath
  }

  return `ext:${lowerExt}`
}

export function getFileIcon(filePath: string): Promise<string | undefined> {
  const cacheKey = getFileIconCacheKey(filePath)

  if (fileIconCache.has(cacheKey)) return fileIconCache.get(cacheKey)!

  const promise = tinker
    .getFileIcon(filePath)
    .then((icon) => icon || undefined)
    .catch(() => undefined)

  fileIconCache.set(cacheKey, promise)
  return promise
}

export function mediaDurationFormat(seconds: number) {
  if (seconds > 3600) {
    return durationFormat(Math.round(seconds * 1000), 'hh:mm:ss')
  }

  return durationFormat(Math.round(seconds * 1000), 'mm:ss')
}

const RELATIVE_UNIT_THRESHOLDS: [
  Intl.RelativeTimeFormatUnit,
  number,
  number
][] = [
  ['year', 24 * 60 * 60 * 1000 * (365 * 2 - 1), 24 * 60 * 60 * 1000 * 365],
  ['month', (24 * 60 * 60 * 1000 * 365) / 12, (24 * 60 * 60 * 1000 * 365) / 12],
  ['week', 24 * 60 * 60 * 1000 * 7, 24 * 60 * 60 * 1000 * 7],
  ['day', 24 * 60 * 60 * 1000, 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000, 60 * 60 * 1000],
  ['minute', 60 * 1000, 60 * 1000],
  ['second', 1000, 1000],
]

const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>()

function getRelativeTimeFormat(
  locale?: string,
  style: Intl.RelativeTimeFormatStyle = 'long'
): Intl.RelativeTimeFormat {
  const key = `${locale || 'default'}:${style}`
  let formatter = relativeTimeFormatCache.get(key)
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, {
      localeMatcher: 'best fit',
      numeric: style === 'long' ? 'auto' : 'always',
      style,
    })
    relativeTimeFormatCache.set(key, formatter)
  }
  return formatter
}

export function formatTimeAgo(
  dateMs: number,
  locale?: string,
  style: Intl.RelativeTimeFormatStyle = 'long'
): string {
  const elapsed = dateMs - Date.now()
  if (!Number.isFinite(elapsed)) return ''

  const formatter = getRelativeTimeFormat(locale, style)

  for (const [unit, threshold, divisor] of RELATIVE_UNIT_THRESHOLDS) {
    const elapsedAbs = Math.abs(elapsed)
    if (elapsedAbs >= threshold || threshold === 1000) {
      return formatter.format(Math.trunc(elapsed / divisor), unit)
    }
  }

  return ''
}

export function formatRelativeDate(
  dateMs: number,
  locale?: string,
  titleFormat = 'yyyy-mm-dd HH:MM:ss'
): { label: string; title: string } {
  const date = new Date(dateMs)

  return {
    label: formatTimeAgo(dateMs, locale),
    title: dateFormat(date, titleFormat),
  }
}
