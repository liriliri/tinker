import { contextBridge } from 'electron'
import * as pty from 'node-pty'
import { homedir, platform } from 'os'

const isWindows = platform() === 'win32'
const defaultShell = isWindows
  ? 'powershell.exe'
  : process.env.SHELL || '/bin/zsh'

interface PtySession {
  process: pty.IPty
  dataCallback: ((data: string) => void) | null
  closeCallback: (() => void) | null
}

const sessions = new Map<string, PtySession>()

const terminalObj = {
  create(id: string, cols: number, rows: number) {
    const existing = sessions.get(id)
    if (existing) {
      existing.process.kill()
      sessions.delete(id)
    }

    const process = pty.spawn(defaultShell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: homedir(),
    })

    const session: PtySession = {
      process,
      dataCallback: null,
      closeCallback: null,
    }

    process.onData((data: string) => {
      if (session.dataCallback) {
        session.dataCallback(data)
      }
    })

    process.onExit(() => {
      if (session.closeCallback) {
        session.closeCallback()
      }
      sessions.delete(id)
    })

    sessions.set(id, session)
  },

  write(id: string, data: string) {
    const session = sessions.get(id)
    if (session) {
      session.process.write(data)
    }
  },

  resize(id: string, cols: number, rows: number) {
    const session = sessions.get(id)
    if (session) {
      session.process.resize(cols, rows)
    }
  },

  destroy(id: string) {
    const session = sessions.get(id)
    if (session) {
      session.process.kill()
      sessions.delete(id)
    }
  },

  onData(id: string, callback: (data: string) => void) {
    const session = sessions.get(id)
    if (session) {
      session.dataCallback = callback
    }
  },

  onClose(id: string, callback: () => void) {
    const session = sessions.get(id)
    if (session) {
      session.closeCallback = callback
    }
  },

  getProcessName(id: string): string {
    const session = sessions.get(id)
    if (session) {
      return session.process.process
    }
    return ''
  },
}

contextBridge.exposeInMainWorld('terminal', terminalObj)

declare global {
  const terminal: typeof terminalObj
}
