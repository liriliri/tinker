import { contextBridge, shell } from 'electron'
import { webSearch } from '../../../share/tools/webImpl'

const api = {
  openExternal(url: string): void {
    shell.openExternal(url)
  },
  webSearch,
}

contextBridge.exposeInMainWorld('aiChat', api)

declare global {
  const aiChat: typeof api
}
