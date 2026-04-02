import { contextBridge } from 'electron'
import * as fs from 'fs/promises'
const diskUsageObj = {
  async checkDirectories(paths: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {}
    await Promise.all(
      paths.map(async (p) => {
        try {
          const stat = await fs.stat(p)
          result[p] = stat.isDirectory()
        } catch {
          result[p] = false
        }
      })
    )
    return result
  },

  async remove(filePath: string): Promise<void> {
    await fs.rm(filePath, { recursive: true, force: true })
  },
}

contextBridge.exposeInMainWorld('diskUsage', diskUsageObj)

declare global {
  const diskUsage: typeof diskUsageObj
}
