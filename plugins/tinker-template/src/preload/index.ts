import { contextBridge } from 'electron'
import { writeFileSync, readFileSync, existsSync } from 'fs'
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
  readFile(filePath: string): string {
    try {
      if (existsSync(filePath)) {
        return readFileSync(filePath, 'utf-8')
      }
      return ''
    } catch (error) {
      console.error('Failed to read file:', error)
      throw new Error('Failed to read file')
    }
  },

  // Write file to specific path
  writeFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content, 'utf-8')
    } catch (error) {
      console.error('Failed to write file:', error)
      throw new Error('Failed to write file')
    }
  },

  // Get app data path
  getAppDataPath(): string {
    const appDataPath = join(homedir(), '.tinker-template')
    return appDataPath
  },
}

contextBridge.exposeInMainWorld('template', templateObj)

declare global {
  const template: typeof templateObj
}
