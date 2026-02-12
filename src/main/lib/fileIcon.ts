import { app } from 'electron'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import { loadMod } from './util'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import startWith from 'licia/startWith'

type ExtractFileIconModule = (path: string, size?: 16 | 32 | 64 | 256) => Buffer

let fileIconToBuffer:
  | ((filePath: string, options: { size: number }) => Promise<Buffer>)
  | null = null

let extractFileIconModule: ExtractFileIconModule | null = null

if (isMac) {
  loadMod('file-icon').then((mod) => {
    if (mod) {
      fileIconToBuffer = mod.fileIconToBuffer
    }
  })
}

if (isWindows) {
  loadMod('extract-file-icon').then((mod) => {
    if (typeof mod === 'function') {
      extractFileIconModule = mod as ExtractFileIconModule
    }
  })
}

const fileIconCache = new Map<string, Buffer>()

export async function getFileIcon(
  filePath: string,
  size: number = 128
): Promise<Buffer | null> {
  const isExtension = startWith(filePath, '.')
  let targetPath = filePath

  if (isExtension) {
    const cacheKey = `${filePath}-${size}`
    if (fileIconCache.has(cacheKey)) {
      return fileIconCache.get(cacheKey)!
    }

    targetPath = path.resolve(os.tmpdir(), `tinker-file${filePath}`)
    await fs.writeFile(targetPath, '')
  } else {
    if (!(await fs.pathExists(targetPath))) {
      return null
    }
  }

  let buffer: Buffer | null = null

  if (isMac && fileIconToBuffer) {
    try {
      buffer = await fileIconToBuffer(targetPath, { size })
    } catch {
      // ignore
    }
  }

  if (!buffer && isWindows && extractFileIconModule) {
    try {
      const result = extractFileIconModule(
        targetPath,
        size as 16 | 32 | 64 | 256
      )
      if (result && result.length > 0) {
        buffer = result
      }
    } catch {
      // ignore
    }
  }

  if (!buffer) {
    const iconSize = isMac ? 'normal' : 'large'
    const icon = await app.getFileIcon(targetPath, { size: iconSize })
    buffer = icon.toPNG()
  }

  if (isExtension) {
    const cacheKey = `${filePath}-${size}`
    fileIconCache.set(cacheKey, buffer)
  }

  return buffer
}
