import { exec } from 'child_process'
import * as pty from 'node-pty'
import { homedir, platform } from 'os'
import { basename } from 'path'
import { existsSync } from 'fs'

const isWindows = platform() === 'win32'
const defaultShell = isWindows
  ? 'powershell.exe'
  : process.env.SHELL || '/bin/zsh'

export interface ShellInfo {
  name: string
  path: string
}

export interface PtySession {
  type: 'local'
  process: pty.IPty
  dataCallback: ((data: string) => void) | null
  closeCallback: (() => void) | null
  inputCallback: (() => void) | null
}

export interface TerminalApi {
  create(
    id: string,
    cols: number,
    rows: number,
    cwd?: string,
    shell?: string
  ): void
  write(id: string, data: string): void
  resize(id: string, cols: number, rows: number): void
  destroy(id: string): void
  onData(id: string, callback: (data: string) => void): void
  onClose(id: string, callback: () => void): void
  onInput(id: string, callback: () => void): void
  getProcessName(id: string): string
  getCwd(id: string): Promise<string>
  getFullCwd(id: string): Promise<string>
  getDefaultShell(): string
  getAvailableShells(): ShellInfo[]
}

export function createTerminalApi(
  sessions: Map<string, PtySession> = new Map()
): TerminalApi {
  return {
    create(
      id: string,
      cols: number,
      rows: number,
      cwd?: string,
      shell?: string
    ) {
      const existing = sessions.get(id)
      if (existing) {
        existing.process.kill()
        sessions.delete(id)
      }

      const proc = pty.spawn(shell || defaultShell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: cwd || homedir(),
      })

      const session: PtySession = {
        type: 'local',
        process: proc,
        dataCallback: null,
        closeCallback: null,
        inputCallback: null,
      }

      proc.onData((data: string) => {
        if (session.dataCallback) {
          session.dataCallback(data)
        }
      })

      proc.onExit(() => {
        if (session.closeCallback) {
          session.closeCallback()
        }
        sessions.delete(id)
      })

      sessions.set(id, session)
    },

    write(id: string, data: string) {
      const session = sessions.get(id)
      if (!session) return

      session.process.write(data)
      if (data.includes('\r') || data.includes('\n')) {
        session.inputCallback?.()
      }
    },

    resize(id: string, cols: number, rows: number) {
      const session = sessions.get(id)
      if (!session) return

      session.process.resize(cols, rows)
    },

    destroy(id: string) {
      const session = sessions.get(id)
      if (!session) return

      session.process.kill()
      sessions.delete(id)
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

    onInput(id: string, callback: () => void) {
      const session = sessions.get(id)
      if (session) {
        session.inputCallback = callback
      }
    },

    getProcessName(id: string): string {
      const session = sessions.get(id)
      if (session) {
        return session.process.process
      }
      return ''
    },

    getCwd(id: string): Promise<string> {
      const session = sessions.get(id)
      if (!session) return Promise.resolve('')

      const pid = session.process.pid
      if (isWindows) return Promise.resolve('')

      return new Promise((resolve) => {
        exec(
          `lsof -p ${pid} -Fn -a -d cwd 2>/dev/null | grep "^n"`,
          { encoding: 'utf8', timeout: 500 },
          (err, stdout) => {
            if (err || !stdout) {
              resolve('')
              return
            }
            resolve(basename(stdout.trim().slice(1)))
          }
        )
      })
    },

    getFullCwd(id: string): Promise<string> {
      const session = sessions.get(id)
      if (!session) return Promise.resolve('')

      const pid = session.process.pid
      if (isWindows) return Promise.resolve('')

      return new Promise((resolve) => {
        exec(
          `lsof -p ${pid} -Fn -a -d cwd 2>/dev/null | grep "^n"`,
          { encoding: 'utf8', timeout: 500 },
          (err, stdout) => {
            if (err || !stdout) {
              resolve('')
              return
            }
            resolve(stdout.trim().slice(1))
          }
        )
      })
    },

    getDefaultShell(): string {
      return defaultShell
    },

    getAvailableShells(): ShellInfo[] {
      const shells: ShellInfo[] = []
      const candidates = isWindows
        ? [
            { name: 'PowerShell', path: 'powershell.exe' },
            { name: 'Command Prompt', path: 'cmd.exe' },
          ]
        : [
            { name: 'zsh', path: '/bin/zsh' },
            { name: 'bash', path: '/bin/bash' },
            { name: 'sh', path: '/bin/sh' },
            { name: 'fish', path: '/usr/local/bin/fish' },
            { name: 'fish', path: '/opt/homebrew/bin/fish' },
          ]

      for (const c of candidates) {
        if (isWindows || existsSync(c.path)) {
          if (!shells.find((s) => s.name === c.name)) {
            shells.push(c)
          }
        }
      }

      return shells
    },
  }
}
