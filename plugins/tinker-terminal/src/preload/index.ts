import { contextBridge } from 'electron'
import * as pty from 'node-pty'
import { homedir, platform } from 'os'

const isWindows = platform() === 'win32'
const defaultShell = isWindows
  ? 'powershell.exe'
  : process.env.SHELL || '/bin/zsh'

let ptyProcess: pty.IPty | null = null
let dataCallback: ((data: string) => void) | null = null
let closeCallback: (() => void) | null = null

const terminalObj = {
  create(cols: number, rows: number) {
    if (ptyProcess) {
      ptyProcess.kill()
    }

    ptyProcess = pty.spawn(defaultShell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: homedir(),
    })

    ptyProcess.onData((data: string) => {
      if (dataCallback) {
        dataCallback(data)
      }
    })

    ptyProcess.onExit(() => {
      if (closeCallback) {
        closeCallback()
      }
      ptyProcess = null
    })
  },

  write(data: string) {
    if (ptyProcess) {
      ptyProcess.write(data)
    }
  },

  resize(cols: number, rows: number) {
    if (ptyProcess) {
      ptyProcess.resize(cols, rows)
    }
  },

  destroy() {
    if (ptyProcess) {
      ptyProcess.kill()
      ptyProcess = null
    }
  },

  onData(callback: (data: string) => void) {
    dataCallback = callback
  },

  onClose(callback: () => void) {
    closeCallback = callback
  },
}

contextBridge.exposeInMainWorld('terminal', terminalObj)

declare global {
  const terminal: typeof terminalObj
}
