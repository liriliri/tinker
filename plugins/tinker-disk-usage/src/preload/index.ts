import { contextBridge } from 'electron'
import * as fs from 'fs/promises'
const diskUsageObj = {
  async remove(filePath: string): Promise<void> {
    await fs.rm(filePath, { recursive: true, force: true })
  },
}

contextBridge.exposeInMainWorld('diskUsage', diskUsageObj)

declare global {
  const diskUsage: typeof diskUsageObj
}
