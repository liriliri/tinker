import { contextBridge } from 'electron'
import { exec } from 'child_process'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import replaceAll from 'licia/replaceAll'

function quote(path: string) {
  return `"${replaceAll(path, '"', '\\"')}"`
}

const api = {
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

  openApp(appPath: string): Promise<{ stdout: string; stderr: string }> {
    let cmd: string
    if (isMac) {
      cmd = `open ${quote(appPath)}`
    } else if (isWindows) {
      cmd = quote(appPath)
    } else {
      cmd = appPath
    }
    return api.execCommand(cmd)
  },

  openDirectory(dirPath: string): Promise<{ stdout: string; stderr: string }> {
    let cmd: string
    if (isMac) {
      cmd = `open ${quote(dirPath)}`
    } else if (isWindows) {
      cmd = `explorer ${quote(dirPath)}`
    } else {
      cmd = `xdg-open ${quote(dirPath)}`
    }
    return api.execCommand(cmd)
  },
}

contextBridge.exposeInMainWorld('hotkeys', api)

declare global {
  const hotkeys: typeof api
}
