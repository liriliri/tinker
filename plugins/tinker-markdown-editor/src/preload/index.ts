import { contextBridge } from 'electron'

const markdownEditorObj = {
  hello() {
    console.log('Hello from Markdown Editor preload script!')
  },
}

contextBridge.exposeInMainWorld('markdownEditor', markdownEditorObj)

declare global {
  const markdownEditor: typeof markdownEditorObj
}
