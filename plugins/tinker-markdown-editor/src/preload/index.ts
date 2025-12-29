import { contextBridge } from 'electron'
import { readFile, writeFile } from 'fs/promises'

const markdownEditorObj = {
  async readFile(filePath: string): Promise<string> {
    return await readFile(filePath, 'utf-8')
  },

  async writeFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, 'utf-8')
  },
}

contextBridge.exposeInMainWorld('markdownEditor', markdownEditorObj)

declare global {
  const markdownEditor: typeof markdownEditorObj
}
