import { contextBridge, shell } from 'electron'
import { promises as fs } from 'fs'

const api = {
  async deleteFile(filePath: string, moveToTrash: boolean): Promise<void> {
    if (moveToTrash) {
      await shell.trashItem(filePath)
    } else {
      await fs.unlink(filePath)
    }
  },
}

contextBridge.exposeInMainWorld('fileSearch', api)

declare global {
  const fileSearch: typeof api
}
