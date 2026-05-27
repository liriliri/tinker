import durationFormat from 'licia/durationFormat'
import dateFormat from 'licia/dateFormat'
import compact from 'licia/compact'
import splitPath from 'licia/splitPath'
import contain from 'licia/contain'
import isWindows from 'licia/isWindows'

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

const EXECUTABLE_EXTS = ['.app', '.exe', '.msi', '.dmg', '.appimage']

function getFileIconCacheKey(filePath: string): string {
  const { ext } = splitPath(filePath)
  const lowerExt = ext.toLowerCase()

  if (!lowerExt || contain(EXECUTABLE_EXTS, lowerExt)) {
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
