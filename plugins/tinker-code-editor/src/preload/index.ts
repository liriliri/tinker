import { contextBridge } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { homedir } from 'os'
import { createTerminalApi } from 'share/lib/terminal'

interface IDirEntry {
  name: string
  path: string
  isDirectory: boolean
}

const codeEditorObj = {
  getHomedir(): string {
    return homedir()
  },

  async readDir(dirPath: string): Promise<IDirEntry[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    const result: IDirEntry[] = []

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      if (entry.name === 'node_modules') continue

      result.push({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      })
    }

    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return result
  },

  async readFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8')
  },

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.promises.writeFile(filePath, content, 'utf-8')
  },

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  },
}

const terminalApi = createTerminalApi()

contextBridge.exposeInMainWorld('codeEditor', codeEditorObj)
contextBridge.exposeInMainWorld('terminal', terminalApi)

declare global {
  const codeEditor: typeof codeEditorObj
  const terminal: typeof terminalApi
}
