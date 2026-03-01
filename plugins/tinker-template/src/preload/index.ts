import { contextBridge } from 'electron'
import { exec } from 'child_process'
import { homedir, platform, arch } from 'os'
import type { SystemInfo } from '../common/types'

const templateObj = {
  execCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      exec(cmd, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || (error ? error.message : ''),
          stderr: stderr || '',
        })
      })
    })
  },

  getSystemInfo(): SystemInfo {
    return {
      platform: platform(),
      arch: arch(),
      homeDir: homedir(),
      nodeVersion: process.version,
    }
  },
}

contextBridge.exposeInMainWorld('template', templateObj)

declare global {
  const template: typeof templateObj
}
