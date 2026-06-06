import { contextBridge } from 'electron'
import { readFileSync } from 'fs'
import { Client, ClientChannel } from 'ssh2'
import { homedir } from 'os'
import {
  getDefaultShell,
  getAvailableShells,
  TerminalSession,
} from 'share/preload/terminal'

interface SSHConfig {
  host: string
  port: number
  username: string
  authType: 'none' | 'password' | 'privateKey'
  password?: string
  privateKey?: string
}

function createSSHSession(
  cols: number,
  rows: number,
  config: SSHConfig
): TerminalSession {
  const client = new Client()
  let stream: ClientChannel | null = null
  let dataCb: ((data: string) => void) | null = null
  let closeCb: (() => void) | null = null
  let inputCb: (() => void) | null = null
  let destroyed = false

  function fail(message: string) {
    dataCb?.(`\r\n[SSH Error: ${message}]\r\n`)
    closeCb?.()
  }

  client.on('ready', () => {
    if (destroyed) {
      client.end()
      return
    }
    client.shell({ term: 'xterm-256color', cols, rows }, (err, s) => {
      if (err) {
        fail(err.message)
        client.end()
        return
      }
      stream = s

      stream.on('data', (data: Buffer) => {
        dataCb?.(data.toString('utf8'))
      })

      stream.on('close', () => {
        closeCb?.()
        client.end()
      })

      stream.stderr.on('data', (data: Buffer) => {
        dataCb?.(data.toString('utf8'))
      })
    })
  })

  client.on('error', (err) => {
    fail(err.message)
  })

  client.on('close', () => {
    if (!destroyed) {
      closeCb?.()
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
      // Schedule the error after the caller has had a chance to register
      // its data/close callbacks via onData/onClose.
      queueMicrotask(() =>
        fail(`Cannot read private key: ${(err as Error).message}`)
      )
      return makeSession()
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

  return makeSession()

  function makeSession(): TerminalSession {
    return {
      write(data: string) {
        if (destroyed || !stream) return
        stream.write(data)
        if (data.includes('\r') || data.includes('\n')) {
          inputCb?.()
        }
      },
      resize(c: number, r: number) {
        if (destroyed || !stream) return
        stream.setWindow(r, c, 0, 0)
      },
      destroy() {
        if (destroyed) return
        destroyed = true
        stream?.end()
        client.end()
      },
      onData(cb) {
        dataCb = cb
      },
      onClose(cb) {
        closeCb = cb
      },
      onInput(cb) {
        inputCb = cb
      },
      getInfo: () => Promise.resolve({ processName: '', cwd: '' }),
    }
  }
}

const terminalObj = {
  createSSH(cols: number, rows: number, config: SSHConfig): TerminalSession {
    return createSSHSession(cols, rows, config)
  },
  getDefaultShell,
  getAvailableShells,
}

contextBridge.exposeInMainWorld('terminal', terminalObj)

declare global {
  var terminal: typeof terminalObj
}
