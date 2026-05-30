import { contextBridge } from 'electron'

const textSearchObj = {}

contextBridge.exposeInMainWorld('textSearch', textSearchObj)

declare global {
  const textSearch: typeof textSearchObj
}
