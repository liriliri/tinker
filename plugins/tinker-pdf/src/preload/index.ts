import { contextBridge } from 'electron'
import { readFile } from 'fs/promises'

const pdfAPI = {
  // Read file as Buffer for PDF loading
  async readFile(filePath: string): Promise<Uint8Array> {
    try {
      const buffer = await readFile(filePath)
      return new Uint8Array(buffer)
    } catch (error) {
      console.error('Failed to read file:', error)
      throw new Error('Failed to read file')
    }
  },
}

contextBridge.exposeInMainWorld('pdf', pdfAPI)

declare global {
  const pdf: typeof pdfAPI
}
