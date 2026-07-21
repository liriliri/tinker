import net from 'net'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { spawn } from 'child_process'
import uuid from 'licia/uuid'
import isWindows from 'licia/isWindows'
import isMac from 'licia/isMac'
import waitUntil from 'licia/waitUntil'
import { isDev, getPlatform } from 'share/common/util'

export interface IpcRequest {
  id: string
  command: string
  data?: Record<string, unknown>
}

export interface IpcResponse {
  id: string
  success: boolean
  data?: unknown
  error?: string
}

function getSocketPath(): string {
  if (isWindows) {
    return '\\\\.\\pipe\\tinker-ipc'
  }
  const homeDir = os.homedir()
  const dataDir = isMac
    ? path.join(homeDir, 'Library/Application Support/TINKER/data')
    : path.join(
        process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config'),
        'TINKER/data'
      )
  return path.join(dataDir, 'tinker.sock')
}

export const SOCKET_PATH = getSocketPath()

function removeSocketFile() {
  if (!isWindows) {
    try {
      fs.unlinkSync(SOCKET_PATH)
    } catch {
      // ignore
    }
  }
}

let server: net.Server | null = null

export type IpcHandler = (req: IpcRequest) => Promise<IpcResponse>

export function startServer(handler: IpcHandler) {
  removeSocketFile()

  server = net.createServer((socket) => {
    let buf = ''
    let handled = false
    socket.on('data', (chunk) => {
      if (handled) return
      buf += chunk.toString()
      let req: IpcRequest
      try {
        req = JSON.parse(buf)
      } catch {
        return
      }
      handled = true
      handler(req)
        .then((res) => {
          if (socket.writable) {
            socket.end(JSON.stringify(res))
          }
        })
        .catch(() => {
          if (socket.writable) {
            socket.end(
              JSON.stringify({
                id: req.id,
                success: false,
                error: 'Internal error',
              })
            )
          }
        })
    })
  })

  server.listen(SOCKET_PATH)
}

export function stopServer() {
  server?.close()
  server = null
  removeSocketFile()
}

export interface LaunchOptions {
  remoteDebuggingPort?: string
}

export function launchTinker(options?: LaunchOptions) {
  const args: string[] = []
  if (options?.remoteDebuggingPort) {
    args.push(`--remote-debugging-port=${options.remoteDebuggingPort}`)
  }

  if (isDev()) {
    args.unshift(path.resolve(__dirname, 'index.js'))
  }

  const env = { ...process.env }
  delete env['ELECTRON_RUN_AS_NODE']

  if (isMac && !isDev()) {
    const execPath = process.execPath
    const contentsIndex = execPath.indexOf('.app/Contents/')
    const appPath = execPath.substring(0, contentsIndex + 4)
    const openArgs = ['-a', appPath]
    if (args.length > 0) {
      openArgs.push('--args', ...args)
    }
    const child = spawn('open', openArgs, {
      detached: true,
      stdio: 'inherit',
      env,
    })
    child.unref()
    return
  }

  if (getPlatform() === 'linux') {
    args.unshift('--no-sandbox')
  }

  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: 'ignore',
    cwd: path.resolve(__dirname, '../..'),
    env,
  })
  child.unref()
}

export async function sendCommand(
  command: string,
  data?: Record<string, unknown>
): Promise<IpcResponse> {
  const invoke = () =>
    new Promise<IpcResponse>((resolve, reject) => {
      let settled = false
      const socket = net.createConnection(SOCKET_PATH, () => {
        const req: IpcRequest = { id: uuid(), command, data }
        socket.write(JSON.stringify(req))
      })

      let buf = ''
      socket.on('data', (chunk) => {
        buf += chunk.toString()
        try {
          const res: IpcResponse = JSON.parse(buf)
          settled = true
          resolve(res)
          socket.end()
        } catch {
          // ignore
        }
      })

      socket.on('error', (err) => {
        if (!settled) reject(err)
      })
      socket.setTimeout(10000, () => {
        if (!settled) {
          socket.destroy()
          reject(new Error('Connection timed out'))
        }
      })
    })

  try {
    return await invoke()
  } catch (err) {
    if (!isConnectionError(err)) {
      throw err
    }
    launchTinker()
    await waitForServer()
    return invoke()
  }
}

function isConnectionError(err: unknown) {
  const code = (err as NodeJS.ErrnoException)?.code
  if (code === 'ECONNREFUSED' || code === 'ENOENT' || code === 'ECONNRESET') {
    return true
  }
  const message = err instanceof Error ? err.message : String(err)
  return /ECONNREFUSED|connect/i.test(message)
}

export function isServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
    socket.setTimeout(3000, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

export function waitForServer(timeout = 10000): Promise<void> {
  return waitUntil(() => isServerRunning(), timeout, 300)
}
