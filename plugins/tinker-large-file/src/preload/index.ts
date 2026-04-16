import { contextBridge, shell } from 'electron'
import { promises as fs } from 'fs'

const largeFileObj = {
  async deleteFiles(
    filePaths: string[],
    moveToTrash: boolean
  ): Promise<{ deleted: number; errors: string[] }> {
    let deleted = 0
    const errors: string[] = []
    for (const filePath of filePaths) {
      try {
        if (moveToTrash) {
          await shell.trashItem(filePath)
        } else {
          await fs.unlink(filePath)
        }
        deleted++
      } catch {
        errors.push(filePath)
      }
    }
    return { deleted, errors }
  },
}

contextBridge.exposeInMainWorld('largeFile', largeFileObj)

declare global {
  const largeFile: typeof largeFileObj
}
