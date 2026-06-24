import fs from 'fs-extra'
import { open } from 'fs/promises'
import { randomBytes } from 'crypto'
import * as path from 'path'
import map from 'licia/map'
import range from 'licia/range'
import isErr from 'licia/isErr'
import toStr from 'licia/toStr'
import type { ShredMethod, ShredProgressEvent } from '../../common/types'

const BUFFER_SIZE = 1024 * 1024
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024

let cancelled = false

export function cancelShred() {
  cancelled = true
}

function resetCancel() {
  cancelled = false
}

function assertNotCancelled() {
  if (cancelled) {
    throw new Error('Cancelled')
  }
}

function getPatterns(method: ShredMethod): (number | null)[] {
  switch (method) {
    case 'quick':
      return [null]
    case 'dod':
      return [0x00, 0xff, null]
    case 'thorough':
      return map(range(7), () => null)
  }
}

function createOverwriteBuffer(len: number, pattern: number | null): Buffer {
  return pattern === null ? randomBytes(len) : Buffer.alloc(len, pattern)
}

async function overwriteFileWithPattern(
  filePath: string,
  pattern: number | null,
  onChunk?: (progress: number) => void
): Promise<void> {
  const stat = await fs.stat(filePath)
  const fileSize = stat.size
  if (fileSize === 0) return

  const fd = await open(filePath, 'r+')
  try {
    const bufferSize = Math.min(BUFFER_SIZE, fileSize)
    let offset = 0

    while (offset < fileSize) {
      assertNotCancelled()

      const len = Math.min(bufferSize, fileSize - offset)
      const buffer = createOverwriteBuffer(len, pattern)

      await fd.write(buffer, 0, len, offset)
      offset += len
      onChunk?.(Math.round((offset / fileSize) * 100))
    }

    await fd.sync()
  } finally {
    await fd.close()
  }
}

async function secureDeleteFileName(filePath: string): Promise<void> {
  let currentPath = filePath
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)

  for (let i = 0; i < 5; i++) {
    assertNotCancelled()
    const randomName = randomBytes(Math.max(8, 16 - i * 2)).toString('hex')
    const newPath = path.join(dir, `${randomName}${ext}`)

    try {
      await fs.rename(currentPath, newPath)
      currentPath = newPath
    } catch {
      break
    }
  }

  await fs.remove(currentPath).catch(() => {})
}

async function shredSingleFile(
  filePath: string,
  method: ShredMethod,
  onProgress?: (percent: number) => void
): Promise<void> {
  const stat = await fs.stat(filePath)
  if (!stat.isFile()) {
    throw new Error('Not a file')
  }
  if (stat.size > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }

  const patterns = getPatterns(method)
  const totalOps = patterns.length

  for (let i = 0; i < patterns.length; i++) {
    assertNotCancelled()
    const start = (i / totalOps) * 100
    const end = ((i + 1) / totalOps) * 100

    await overwriteFileWithPattern(filePath, patterns[i], (fileProgress) => {
      const progress = start + (end - start) * (fileProgress / 100)
      onProgress?.(Math.round(progress))
    })
  }

  await secureDeleteFileName(filePath)
  onProgress?.(100)
}

export async function shredFiles(
  filePaths: string[],
  method: ShredMethod,
  onProgress?: (event: ShredProgressEvent) => void
): Promise<{ shredded: number; errors: { path: string; message: string }[] }> {
  resetCancel()
  let shredded = 0
  const errors: { path: string; message: string }[] = []
  const total = filePaths.length

  for (let index = 0; index < filePaths.length; index++) {
    const filePath = filePaths[index]
    assertNotCancelled()

    try {
      await shredSingleFile(filePath, method, (fileProgress) => {
        onProgress?.({
          path: filePath,
          fileProgress,
          overallProgress: Math.round(
            ((index + fileProgress / 100) / total) * 100
          ),
        })
      })

      shredded++
      onProgress?.({
        path: filePath,
        fileProgress: 100,
        overallProgress: Math.round(((index + 1) / total) * 100),
      })
    } catch (err: unknown) {
      if (cancelled) {
        break
      }
      errors.push({
        path: filePath,
        message: isErr(err) ? err.message : toStr(err),
      })
    }
  }

  return { shredded, errors }
}
