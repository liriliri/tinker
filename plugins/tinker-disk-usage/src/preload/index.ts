import { contextBridge, shell } from 'electron'
import { rm } from 'fs/promises'

const diskUsageObj = {
  async deleteItem(
    itemPath: string,
    moveToTrash: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (moveToTrash) {
        await shell.trashItem(itemPath)
      } else {
        await rm(itemPath, { recursive: true, force: true })
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },
}

contextBridge.exposeInMainWorld('diskUsage', diskUsageObj)

declare global {
  const diskUsage: typeof diskUsageObj
}
