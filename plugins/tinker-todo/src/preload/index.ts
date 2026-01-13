import { contextBridge } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { homedir } from 'os'

const todoObj = {
  getHomedir(): string {
    return homedir()
  },

  async readFile(filePath: string): Promise<string> {
    return await readFile(filePath, 'utf-8')
  },

  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, 'utf-8')
  },
}

contextBridge.exposeInMainWorld('todo', todoObj)

declare global {
  const todo: typeof todoObj
}
