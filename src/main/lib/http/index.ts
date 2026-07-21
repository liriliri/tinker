import http from 'http'
import { WebSocketServer } from 'ws'
import getPort from 'licia/getPort'
import startWith from 'licia/startWith'
import { InspectAddress, parseInspectAddress } from '../plugin/inspect'
import { createApp } from './app'
import { parseHttpAuthArgv } from './auth'
import {
  disposeAllHttpSessions,
  disposePluginHttpSession,
  handleUpgrade,
} from './screencast'

export { disposePluginHttpSession }

interface HttpState {
  host: string
  port: number
  url: string
  server: http.Server
  wss: WebSocketServer
}

let state: HttpState | null = null

function displayHost(host: string) {
  return host === '0.0.0.0' ? '127.0.0.1' : host
}

export async function stopHttp() {
  disposeAllHttpSessions()
  if (!state) return
  const current = state
  state = null
  await new Promise<void>((resolve) => {
    current.wss.close()
    current.server.close(() => resolve())
  })
}

export async function startHttp(
  address?: InspectAddress | string | true | boolean
): Promise<{ url: string; host: string; port: number }> {
  const parsed =
    typeof address === 'object' && address && 'host' in address
      ? address
      : parseInspectAddress(address === undefined ? true : address)

  if (!parsed) {
    throw new Error('Invalid http address')
  }

  await stopHttp()

  const host = parsed.host || '127.0.0.1'
  const port = parsed.port
    ? await getPort(parsed.port, host)
    : await getPort(undefined, host)

  if (parsed.port && port !== parsed.port) {
    throw new Error(`HTTP port ${parsed.port} is already in use`)
  }

  const auth = parseHttpAuthArgv()
  const wss = new WebSocketServer({ noServer: true })
  const server = http.createServer(createApp(auth).callback())
  server.on('upgrade', (req, socket, head) => {
    handleUpgrade(wss, req, socket, head, auth)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.once('listening', () => resolve())
    server.listen(port, host)
  })

  const shown = displayHost(host)
  state = {
    host,
    port,
    url: `http://${shown}:${port}`,
    server,
    wss,
  }

  return { url: state.url, host: shown, port }
}

export function parseHttpArgv(
  argv: string[] = process.argv
): InspectAddress | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--http') {
      const next = argv[i + 1]
      if (next && !startWith(next, '-')) {
        return parseInspectAddress(next)
      }
      return parseInspectAddress(true)
    }
    if (startWith(arg, '--http=')) {
      return parseInspectAddress(arg.slice('--http='.length))
    }
  }
  return undefined
}
