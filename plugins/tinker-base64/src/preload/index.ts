import { contextBridge } from 'electron'
import * as fs from 'fs'

const base64Obj = {
  async readFile(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath)
  },
  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    return fs.promises.writeFile(filePath, data)
  },
}

contextBridge.exposeInMainWorld('base64', base64Obj)

declare global {
  const base64: {
    readFile(filePath: string): Promise<Uint8Array>
    writeFile(filePath: string, data: Uint8Array): Promise<void>
  }
}
