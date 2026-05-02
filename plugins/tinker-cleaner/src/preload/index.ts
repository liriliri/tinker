import { contextBridge, shell } from 'electron'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'

const cleanerObj = {
  async cleanPath(
    targetPath: string,
    moveToTrash: boolean
  ): Promise<{ cleaned: number; errors: string[] }> {
    let cleaned = 0
    const errors: string[] = []

    try {
      const stat = await fs.stat(targetPath)
      if (!stat.isDirectory()) {
        try {
          if (moveToTrash) {
            await shell.trashItem(targetPath)
          } else {
            await fs.unlink(targetPath)
          }
          cleaned++
        } catch {
          errors.push(targetPath)
        }
        return { cleaned, errors }
      }
    } catch {
      return { cleaned, errors }
    }

    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(targetPath, entry.name)
        try {
          if (moveToTrash) {
            await shell.trashItem(fullPath)
          } else if (entry.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true })
          } else {
            await fs.unlink(fullPath)
          }
          cleaned++
        } catch {
          errors.push(fullPath)
        }
      }
    } catch {
      errors.push(targetPath)
    }

    return { cleaned, errors }
  },

  getHomePath(): string {
    return os.homedir()
  },
}

contextBridge.exposeInMainWorld('cleaner', cleanerObj)

declare global {
  const cleaner: typeof cleanerObj
}
