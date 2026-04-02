import { contextBridge } from 'electron'
import * as fs from 'fs/promises'
import { homedir, platform } from 'os'
import * as path from 'path'

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

  homedir(): string {
    return homedir()
  },

  platform(): string {
    return platform()
  },

  pathSep(): string {
    return path.sep
  },
}

contextBridge.exposeInMainWorld('diskUsage', diskUsageObj)

declare global {
  const diskUsage: typeof diskUsageObj
}
