import durationFormat from 'licia/durationFormat'
import dateFormat from 'licia/dateFormat'
import splitPath from 'licia/splitPath'

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

export async function resolveSavePath(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) return filePath

  const { dir, name, ext } = splitPath(filePath)
  const base = `${dir}${name.slice(0, name.length - ext.length)}`

  const hourPath = `${base}-${dateFormat('yyyymmddHH')}${ext}`
  if (!(await fileExists(hourPath))) return hourPath

  return `${base}-${dateFormat('yyyymmddHHMM')}${ext}`
}

export function mediaDurationFormat(seconds: number) {
  if (seconds > 3600) {
    return durationFormat(Math.round(seconds * 1000), 'hh:mm:ss')
  }

  return durationFormat(Math.round(seconds * 1000), 'mm:ss')
}
