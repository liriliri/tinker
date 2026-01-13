import { contextBridge } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const todoAPI = {
  readFile(filePath: string): string {
    try {
      if (!existsSync(filePath)) {
        return ''
      }
      return readFileSync(filePath, 'utf-8')
    } catch (error) {
      console.error('Failed to read file:', error)
      throw new Error(`Failed to read file: ${filePath}`)
    }
  },

  writeFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content, 'utf-8')
    } catch (error) {
      console.error('Failed to write file:', error)
      throw new Error(`Failed to write file: ${filePath}`)
    }
  },

  fileExists(filePath: string): boolean {
    return existsSync(filePath)
  },
}

contextBridge.exposeInMainWorld('todoAPI', todoAPI)

declare global {
  const todoAPI: typeof todoAPI
}
