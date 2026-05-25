import { contextBridge } from 'electron'
import { exec } from 'child_process'
import { readFileSync } from 'fs'
import * as pty from 'node-pty'
import { Client, ClientChannel } from 'ssh2'
import { homedir, platform } from 'os'
import { basename } from 'path'
import { existsSync } from 'fs'

const isWindows = platform() === 'win32'
const defaultShell = isWindows
  ? 'powershell.exe'
  : process.env.SHELL || '/bin/zsh'

interface ShellInfo {
  name: string
  path: string
}

interface SSHConfig {
  host: string
  port: number
  username: string
  authType: 'none' | 'password' | 'privateKey'
  password?: string
  privateKey?: string
}

interface PtySession {
  type: 'local' | 'ssh'
  process?: pty.IPty
  sshClient?: Client
  sshStream?: ClientChannel
  dataCallback: ((data: string) => void) | null
  closeCallback: (() => void) | null
  inputCallback: (() => void) | null
}

const sessions = new Map<string, PtySession>()

const terminalObj = {
  create(id: string, cols: number, rows: number, cwd?: string, shell?: string) {
    const existing = sessions.get(id)
    if (existing) {
      if (existing.type === 'local' && existing.process) {
        existing.process.kill()
      }
      sessions.delete(id)
    }

    const process = pty.spawn(shell || defaultShell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: cwd || homedir(),
    })

    const session: PtySession = {
      type: 'local',
      process,
      dataCallback: null,
      closeCallback: null,
      inputCallback: null,
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

  createSSH(id: string, cols: number, rows: number, config: SSHConfig) {
    const existing = sessions.get(id)
    if (existing) {
      if (existing.type === 'local' && existing.process) {
        existing.process.kill()
      } else if (existing.type === 'ssh') {
        existing.sshStream?.end()
        existing.sshClient?.end()
      }
      sessions.delete(id)
    }

    const client = new Client()

    const session: PtySession = {
      type: 'ssh',
      sshClient: client,
      dataCallback: null,
      closeCallback: null,
      inputCallback: null,
    }

    sessions.set(id, session)

    client.on('ready', () => {
      client.shell({ term: 'xterm-256color', cols, rows }, (err, stream) => {
        if (err) {
          if (session.dataCallback) {
            session.dataCallback(`\r\n[SSH Error: ${err.message}]\r\n`)
          }
          if (session.closeCallback) {
            session.closeCallback()
          }
          client.end()
          sessions.delete(id)
          return
        }

        session.sshStream = stream

        stream.on('data', (data: Buffer) => {
          if (session.dataCallback) {
            session.dataCallback(data.toString('utf8'))
          }
        })

        stream.on('close', () => {
          if (session.closeCallback) {
            session.closeCallback()
          }
          client.end()
          sessions.delete(id)
        })

        stream.stderr.on('data', (data: Buffer) => {
          if (session.dataCallback) {
            session.dataCallback(data.toString('utf8'))
          }
        })
      })
    })

    client.on('error', (err) => {
      if (session.dataCallback) {
        session.dataCallback(`\r\n[SSH Error: ${err.message}]\r\n`)
      }
      if (session.closeCallback) {
        session.closeCallback()
      }
      sessions.delete(id)
    })

    client.on('close', () => {
      if (sessions.has(id)) {
        if (session.closeCallback) {
          session.closeCallback()
        }
        sessions.delete(id)
      }
    })

    const connectConfig: Record<string, unknown> = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: 10000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
      tryKeyboard: true,
    }

    if (config.authType === 'password' && config.password) {
      connectConfig.password = config.password
    } else if (config.authType === 'privateKey' && config.privateKey) {
      try {
        const keyPath = config.privateKey.replace(/^~/, homedir())
        connectConfig.privateKey = readFileSync(keyPath, 'utf8')
      } catch (err) {
        if (session.dataCallback) {
          session.dataCallback(
            `\r\n[SSH Error: Cannot read private key: ${
              (err as Error).message
            }]\r\n`
          )
        }
        if (session.closeCallback) {
          session.closeCallback()
        }
        sessions.delete(id)
        return
      }
    }

    // Keyboard-interactive auth: respond to server prompts
    client.on(
      'keyboard-interactive',
      (_name, _instructions, _lang, prompts, finish) => {
        if (config.authType === 'password' && config.password) {
          finish([config.password])
        } else {
          finish(prompts.map(() => ''))
        }
      }
    )

    client.connect(connectConfig as Parameters<typeof client.connect>[0])
  },

  write(id: string, data: string) {
    const session = sessions.get(id)
    if (!session) return

    if (session.type === 'local' && session.process) {
      session.process.write(data)
      if (data.includes('\r') || data.includes('\n')) {
        session.inputCallback?.()
      }
    } else if (session.type === 'ssh' && session.sshStream) {
      session.sshStream.write(data)
      if (data.includes('\r') || data.includes('\n')) {
        session.inputCallback?.()
      }
    }
  },

  resize(id: string, cols: number, rows: number) {
    const session = sessions.get(id)
    if (!session) return

    if (session.type === 'local' && session.process) {
      session.process.resize(cols, rows)
    } else if (session.type === 'ssh' && session.sshStream) {
      session.sshStream.setWindow(rows, cols, 0, 0)
    }
  },

  destroy(id: string) {
    const session = sessions.get(id)
    if (!session) return

    if (session.type === 'local' && session.process) {
      session.process.kill()
    } else if (session.type === 'ssh') {
      session.sshStream?.end()
      session.sshClient?.end()
    }
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
    if (session?.type === 'local' && session.process) {
      return session.process.process
    }
    return ''
  },

  getCwd(id: string): Promise<string> {
    const session = sessions.get(id)
    if (!session || session.type !== 'local' || !session.process) {
      return Promise.resolve('')
    }

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
    if (!session || session.type !== 'local' || !session.process) {
      return Promise.resolve('')
    }

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

contextBridge.exposeInMainWorld('terminal', terminalObj)

declare global {
  const terminal: typeof terminalObj
}
