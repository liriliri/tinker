import { contextBridge } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { RenameOperation } from '../common/types'

const renamerObj = {
  async readDir(dirPath: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter((e) => e.isFile())
      .map((e) => path.join(dirPath, e.name))
  },

  async renameFiles(
    ops: RenameOperation[]
  ): Promise<{ success: number; errors: string[] }> {
    let success = 0
    const errors: string[] = []

    for (const op of ops) {
      try {
        await fs.promises.rename(op.oldPath, op.newPath)
        success++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${path.basename(op.oldPath)}: ${msg}`)
      }
    }

    return { success, errors }
  },
  joinPath(...parts: string[]): string {
    return path.join(...parts)
  },
}

contextBridge.exposeInMainWorld('renamer', renamerObj)

declare global {
  const renamer: typeof renamerObj
}
