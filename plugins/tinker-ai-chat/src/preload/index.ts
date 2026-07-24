import { contextBridge } from 'electron'
import { webSearch } from '../../../share/tools/webImpl'

const api = {
  webSearch,
}

contextBridge.exposeInMainWorld('aiChat', api)

declare global {
  const aiChat: typeof api
}
