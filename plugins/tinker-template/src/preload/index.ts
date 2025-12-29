import { contextBridge } from 'electron'
import { readFile, writeFile, access } from 'fs/promises'
import { homedir, platform, arch } from 'os'
import { join } from 'path'

const templateObj = {
  // Get greeting message
  getGreeting(name: string): string {
    return `Hello, ${name}!`
  },

  // Get current timestamp
  getCurrentTime(): string {
    return new Date().toLocaleString()
  },

  // Get system information
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

  // Read file from specific path
  async readFile(filePath: string): Promise<string> {
    try {
      await access(filePath)
      return await readFile(filePath, 'utf-8')
    } catch {
      return ''
    }
  },

  // Write file to specific path
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await writeFile(filePath, content, 'utf-8')
    } catch (error) {
      console.error('Failed to write file:', error)
      throw new Error('Failed to write file')
    }
  },

  // Get app data path
  getAppDataPath(): string {
    return join(homedir(), '.tinker-template')
  },
}

contextBridge.exposeInMainWorld('template', templateObj)

declare global {
  const template: typeof templateObj
}
