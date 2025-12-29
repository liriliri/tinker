import { contextBridge } from 'electron'
import * as fs from 'fs'

const markdownEditorObj = {
  readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8')
  },

  writeFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf-8')
  },
}

contextBridge.exposeInMainWorld('markdownEditor', markdownEditorObj)

declare global {
  const markdownEditor: typeof markdownEditorObj
}
