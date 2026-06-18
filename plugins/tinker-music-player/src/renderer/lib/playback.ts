import md5 from 'licia/md5'
import { getFileExt } from 'share/lib/fileType'

export const TRANSCODE_EXTS = new Set(['ape'])

let currentTask: ReturnType<typeof tinker.runFFmpeg> | null = null

export function needsTranscode(filePath: string): boolean {
  return TRANSCODE_EXTS.has(getFileExt(filePath))
}

export function cancelTranscode() {
  currentTask?.kill()
  currentTask = null
}

async function getCachePath(filePath: string): Promise<string> {
  const stats = await tinker.fstat(filePath)
  const tempDir = await tinker.getPath('temp')
  const key = md5(`${filePath}:${stats.mtime.getTime()}`)
  return `${tempDir}/tinker-music-cache-${key}.m4a`
}

async function isCacheValid(cachePath: string): Promise<boolean> {
  try {
    const stats = await tinker.fstat(cachePath)
    return stats.size > 0
  } catch {
    return false
  }
}

export async function resolvePlaybackUrl(
  filePath: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!needsTranscode(filePath)) {
    return `file://${filePath}`
  }

  const cachePath = await getCachePath(filePath)
  if (await isCacheValid(cachePath)) {
    return `file://${cachePath}`
  }

  cancelTranscode()

  const task = tinker.runFFmpeg(
    ['-i', filePath, '-vn', '-c:a', 'aac', '-b:a', '256k', '-y', cachePath],
    (progress) => {
      if (progress.percent != null) {
        onProgress?.(progress.percent)
      }
    }
  )
  currentTask = task

  try {
    await task
  } finally {
    if (currentTask === task) {
      currentTask = null
    }
  }

  return `file://${cachePath}`
}
