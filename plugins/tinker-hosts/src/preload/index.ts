import { contextBridge } from 'electron'

const hostsObj = {
  // Future implementation for hosts management
}

contextBridge.exposeInMainWorld('hosts', hostsObj)

declare global {
  const hosts: typeof hostsObj
}
