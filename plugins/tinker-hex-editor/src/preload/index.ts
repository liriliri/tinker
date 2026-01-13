import { contextBridge } from 'electron'
import { readFile, writeFile } from 'fs/promises'

const hexEditorObj = {
  // Read file as buffer
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await readFile(filePath)
    } catch (error) {
      console.error('Failed to read file:', error)
      throw new Error('Failed to read file')
    }
  },

  // Write buffer to file
  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    try {
      await writeFile(filePath, Buffer.from(data))
    } catch (error) {
      console.error('Failed to write file:', error)
      throw new Error('Failed to write file')
    }
  },
}

contextBridge.exposeInMainWorld('hexEditor', hexEditorObj)

declare global {
  const hexEditor: typeof hexEditorObj
}
