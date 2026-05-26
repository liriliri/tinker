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

const terminalApi = createTerminalApi()

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

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  },

  createTerminal: terminalApi.create,
  writeTerminal: terminalApi.write,
  resizeTerminal: terminalApi.resize,
  destroyTerminal: terminalApi.destroy,
  onTerminalData: terminalApi.onData,
  onTerminalClose: terminalApi.onClose,
  onTerminalInput: terminalApi.onInput,
  getTerminalProcessName: terminalApi.getProcessName,
  getTerminalCwd: terminalApi.getCwd,
  getTerminalFullCwd: terminalApi.getFullCwd,
  getDefaultShell: terminalApi.getDefaultShell,
  getAvailableShells: terminalApi.getAvailableShells,
}

contextBridge.exposeInMainWorld('codeEditor', codeEditorObj)

declare global {
  const codeEditor: typeof codeEditorObj
}
