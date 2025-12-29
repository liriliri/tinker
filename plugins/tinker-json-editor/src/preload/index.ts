import { contextBridge } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const jsonEditorObj = {
  readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8')
  },

  writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf-8')
  },

  getFileName(filePath: string): string {
    return path.basename(filePath)
  },
}

contextBridge.exposeInMainWorld('jsonEditor', jsonEditorObj)

declare global {
  const jsonEditor: typeof jsonEditorObj
}
