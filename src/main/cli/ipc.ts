import net from 'net'
import path from 'path'
import os from 'os'
import fs from 'fs'
import uuid from 'licia/uuid'
import isWindows from 'licia/isWindows'
import isMac from 'licia/isMac'
import waitUntil from 'licia/waitUntil'

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

export function sendCommand(
  command: string,
  data?: Record<string, unknown>
): Promise<IpcResponse> {
  return new Promise((resolve, reject) => {
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
}

function isServerRunning(): Promise<boolean> {
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
