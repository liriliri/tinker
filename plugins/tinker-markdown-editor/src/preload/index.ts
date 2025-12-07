import { contextBridge } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const markdownEditorObj = {
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

contextBridge.exposeInMainWorld('markdownEditor', markdownEditorObj)

declare global {
  const markdownEditor: typeof markdownEditorObj
}
