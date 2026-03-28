import { contextBridge, shell } from 'electron'
import os from 'node:os'
import {
  editFile,
  listDir,
  readFile,
  writeFile,
} from '../../../share/tools/fileSystemImpl'
import { exec } from '../../../share/tools/shellImpl'
import { webFetch, webSearch } from '../../../share/tools/webImpl'

// ---------------------------------------------------------------------------
// contextBridge
// ---------------------------------------------------------------------------

const aiAssistantObj = {
  openExternal(url: string): void {
    shell.openExternal(url)
  },
  getHomeDir(): string {
    return os.homedir()
  },
  getSystemInfo(): { platform: string; arch: string } {
    const system = os.type()
    const platform =
      system === 'Darwin'
        ? 'macOS'
        : system === 'Windows_NT'
        ? 'Windows'
        : system
    return { platform: `${platform} ${os.arch()}`, arch: os.arch() }
  },
  exec,
  readFile,
  writeFile,
  editFile,
  listDir,
  webSearch,
  webFetch,
}

contextBridge.exposeInMainWorld('aiAssistant', aiAssistantObj)

declare global {
  const aiAssistant: typeof aiAssistantObj
}
