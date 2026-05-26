import { contextBridge } from 'electron'
import { readFileSync } from 'fs'
import { Client, ClientChannel } from 'ssh2'
import { homedir } from 'os'
import { createTerminalApi, PtySession } from 'share/lib/terminal'

interface SSHConfig {
  host: string
  port: number
  username: string
  authType: 'none' | 'password' | 'privateKey'
  password?: string
  privateKey?: string
}

interface SSHSession {
  type: 'ssh'
  sshClient: Client
  sshStream?: ClientChannel
  dataCallback: ((data: string) => void) | null
  closeCallback: (() => void) | null
  inputCallback: (() => void) | null
}

type Session = PtySession | SSHSession

const sessions = new Map<string, Session>()
const localSessions = sessions as unknown as Map<string, PtySession>
const baseApi = createTerminalApi(localSessions)

function destroySession(id: string) {
  const session = sessions.get(id)
  if (!session) return
  if (session.type === 'local') {
    session.process.kill()
  } else if (session.type === 'ssh') {
    session.sshStream?.end()
    session.sshClient.end()
  }
  sessions.delete(id)
}

const terminalObj = {
  ...baseApi,

  create(id: string, cols: number, rows: number, cwd?: string, shell?: string) {
    destroySession(id)
    baseApi.create(id, cols, rows, cwd, shell)
  },

  createSSH(id: string, cols: number, rows: number, config: SSHConfig) {
    destroySession(id)

    const client = new Client()

    const session: SSHSession = {
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

    if (session.type === 'local') {
      session.process.write(data)
    } else if (session.type === 'ssh' && session.sshStream) {
      session.sshStream.write(data)
    }
    if (data.includes('\r') || data.includes('\n')) {
      session.inputCallback?.()
    }
  },

  resize(id: string, cols: number, rows: number) {
    const session = sessions.get(id)
    if (!session) return

    if (session.type === 'local') {
      session.process.resize(cols, rows)
    } else if (session.type === 'ssh' && session.sshStream) {
      session.sshStream.setWindow(rows, cols, 0, 0)
    }
  },

  destroy(id: string) {
    destroySession(id)
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
    if (session?.type === 'local') {
      return session.process.process
    }
    return ''
  },

  getCwd(id: string): Promise<string> {
    const session = sessions.get(id)
    if (!session || session.type !== 'local') {
      return Promise.resolve('')
    }
    return baseApi.getCwd(id)
  },

  getFullCwd(id: string): Promise<string> {
    const session = sessions.get(id)
    if (!session || session.type !== 'local') {
      return Promise.resolve('')
    }
    return baseApi.getFullCwd(id)
  },
}

contextBridge.exposeInMainWorld('terminal', terminalObj)

declare global {
  // @ts-expect-error Each plugin declares its own terminal global
  var terminal: typeof terminalObj
}
