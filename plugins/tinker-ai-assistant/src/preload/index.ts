import { contextBridge } from 'electron'
import os from 'node:os'
import {
  editFile,
  listDir,
  readFile,
  writeFile,
} from 'share/tools/fileSystemImpl'
import { exec } from 'share/tools/shellImpl'
import { webFetch, webSearch } from 'share/tools/webImpl'

// ---------------------------------------------------------------------------
// contextBridge
// ---------------------------------------------------------------------------

const api = {
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

contextBridge.exposeInMainWorld('aiAssistant', api)

declare global {
  const aiAssistant: typeof api
}
