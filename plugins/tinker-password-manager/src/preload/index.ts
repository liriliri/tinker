import { contextBridge } from 'electron'
import { readFile, writeFile } from 'fs/promises'

const passwordManagerAPI = {
  // Read .kdbx file as ArrayBuffer
  async readFile(filePath: string): Promise<ArrayBuffer> {
    try {
      const buffer = await readFile(filePath)
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      )
    } catch (error) {
      console.error('Failed to read file:', error)
      throw new Error('Failed to read file')
    }
  },

  // Write .kdbx file from Uint8Array
  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    try {
      await writeFile(filePath, Buffer.from(data))
    } catch (error) {
      console.error('Failed to write file:', error)
      throw new Error('Failed to write file')
    }
  },
}

contextBridge.exposeInMainWorld('passwordManager', passwordManagerAPI)

declare global {
  const passwordManager: typeof passwordManagerAPI
}
