import { contextBridge } from 'electron'
import * as fs from 'fs'

const hashObj = {
  async readFile(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath)
  },
}

contextBridge.exposeInMainWorld('hash', hashObj)

// Buffer will be serialized to Uint8Array when crossing context bridge
declare global {
  const hash: {
    readFile(filePath: string): Promise<Uint8Array>
  }
}
