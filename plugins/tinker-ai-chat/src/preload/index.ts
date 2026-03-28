import { contextBridge, shell } from 'electron'
import { webSearch } from '../../../share/tools/webImpl'

const aiChatObj = {
  openExternal(url: string): void {
    shell.openExternal(url)
  },
  webSearch,
}

contextBridge.exposeInMainWorld('aiChat', aiChatObj)

declare global {
  const aiChat: typeof aiChatObj
}
