import { contextBridge } from 'electron'
import fs from 'fs-extra'
import * as path from 'path'
import concat from 'licia/concat'
import type { ShredMethod, ShredProgressEvent } from '../common/types'
import { cancelShred, shredFiles as shredFilesCore } from './lib/fileShredder'

async function collectFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  let files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isFile()) {
      files.push(fullPath)
    } else if (entry.isDirectory()) {
      files = concat(files, await collectFiles(fullPath))
    }
  }

  return files
}

const api = {
  readDir(dirPath: string): Promise<string[]> {
    return collectFiles(dirPath)
  },

  async statFile(
    filePath: string
  ): Promise<{ size: number; isFile: boolean } | null> {
    if (!(await fs.pathExists(filePath))) return null

    const stat = await fs.stat(filePath)
    return { size: stat.size, isFile: stat.isFile() }
  },

  cancelShred() {
    cancelShred()
  },

  async shredFiles(
    filePaths: string[],
    method: ShredMethod,
    onProgress?: (event: ShredProgressEvent) => void
  ) {
    return shredFilesCore(filePaths, method, onProgress)
  },
}

contextBridge.exposeInMainWorld('fileShredder', api)

declare global {
  const fileShredder: typeof api
}
