import { contextBridge } from 'electron'
import { homedir, platform, arch } from 'os'
import { join } from 'path'

const templateObj = {
  getGreeting(name: string): string {
    return `Hello, ${name}!`
  },

  getCurrentTime(): string {
    return new Date().toLocaleString()
  },

  getSystemInfo(): {
    platform: string
    arch: string
    homeDir: string
    nodeVersion: string
  } {
    return {
      platform: platform(),
      arch: arch(),
      homeDir: homedir(),
      nodeVersion: process.version,
    }
  },

  getAppDataPath(): string {
    return join(homedir(), '.tinker-template')
  },
}

contextBridge.exposeInMainWorld('template', templateObj)

declare global {
  const template: typeof templateObj
}
