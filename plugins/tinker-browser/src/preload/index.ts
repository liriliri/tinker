import { contextBridge } from 'electron'

const browserObj = {}

contextBridge.exposeInMainWorld('browser', browserObj)

declare global {
  const browser: typeof browserObj
}
