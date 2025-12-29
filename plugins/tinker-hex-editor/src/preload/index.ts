import { contextBridge } from 'electron'
import { readFileSync, writeFileSync } from 'fs'

const hexEditorAPI = {
  // Read file as buffer
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return readFileSync(filePath)
    } catch (error) {
      console.error('Failed to read file:', error)
      throw new Error('Failed to read file')
    }
  },

  // Write buffer to file
  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    try {
      writeFileSync(filePath, Buffer.from(data))
    } catch (error) {
      console.error('Failed to write file:', error)
      throw new Error('Failed to write file')
    }
  },
}

contextBridge.exposeInMainWorld('hexEditor', hexEditorAPI)

declare global {
  const hexEditor: typeof hexEditorAPI
}
