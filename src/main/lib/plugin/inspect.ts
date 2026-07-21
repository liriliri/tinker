import http from 'http'
import { WebContents } from 'electron'
import { WebSocketServer, WebSocket } from 'ws'
import getPort from 'licia/getPort'
import uuid from 'licia/uuid'
import toNum from 'licia/toNum'

export interface InspectAddress {
  host: string
  port?: number
}

interface InspectSession {
  id: string
  host: string
  port: number
  url: string
  title: string
  pageUrl: string
  server: http.Server
  wss: WebSocketServer
  webContents: WebContents
  clients: Set<WebSocket>
  onDebuggerMessage: (
    event: Electron.Event,
    method: string,
    params: unknown,
    sessionId: string
  ) => void
  onDetach: () => void
  onDestroyed: () => void
}

const sessions = new Map<string, InspectSession>()

function displayHost(host: string) {
  return host === '0.0.0.0' ? '127.0.0.1' : host
}

export function parseInspectAddress(
  value: unknown
): InspectAddress | undefined {
  if (value === undefined || value === false || value === null) {
    return undefined
  }
  if (value === true || value === '') {
    return { host: '127.0.0.1' }
  }
  const str = String(value).trim()
  if (!str) {
    return { host: '127.0.0.1' }
  }
  if (str.includes(':')) {
    const idx = str.lastIndexOf(':')
    const host = str.slice(0, idx) || '127.0.0.1'
    const port = toNum(str.slice(idx + 1))
    if (!port || port < 1 || port > 65535) {
      throw new Error(`Invalid inspect address: ${str}`)
    }
    return { host, port }
  }
  const port = toNum(str)
  if (!port || port < 1 || port > 65535) {
    throw new Error(`Invalid inspect port: ${str}`)
  }
  return { host: '127.0.0.1', port }
}

function buildTarget(session: InspectSession) {
  const alive = !session.webContents.isDestroyed()
  const title = (alive && session.webContents.getTitle()) || session.title
  const pageUrl = (alive && session.webContents.getURL()) || session.pageUrl
  const host = displayHost(session.host)

  return {
    description: '',
    devtoolsFrontendUrl: `devtools://devtools/bundled/inspector.html?ws=${host}:${session.port}/${session.id}`,
    id: session.id,
    title,
    type: 'page',
    url: pageUrl,
    webSocketDebuggerUrl: session.url,
  }
}

function sendJson(res: http.ServerResponse, data: unknown) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  })
  res.end(JSON.stringify(data))
}

function attachDebugger(webContents: WebContents) {
  if (!webContents.debugger.isAttached()) {
    webContents.debugger.attach('1.3')
  }
}

function detachDebugger(webContents: WebContents) {
  try {
    if (!webContents.isDestroyed() && webContents.debugger.isAttached()) {
      webContents.debugger.detach()
    }
  } catch {
    // already detached
  }
}

function closeClients(session: InspectSession) {
  for (const client of session.clients) {
    try {
      client.close()
    } catch {
      // ignore
    }
  }
  session.clients.clear()
}

export function stopPluginInspect(pluginId: string) {
  const session = sessions.get(pluginId)
  if (!session) {
    return
  }
  sessions.delete(pluginId)

  if (!session.webContents.isDestroyed()) {
    session.webContents.debugger.removeListener(
      'message',
      session.onDebuggerMessage
    )
    session.webContents.debugger.removeListener('detach', session.onDetach)
    session.webContents.removeListener('destroyed', session.onDestroyed)
    detachDebugger(session.webContents)
  }

  closeClients(session)
  session.wss.close()
  session.server.close()
}

export async function startPluginInspect(
  pluginId: string,
  webContents: WebContents,
  options: {
    address?: InspectAddress
    title?: string
    pageUrl?: string
  } = {}
): Promise<string> {
  const address = options.address || { host: '127.0.0.1' }
  stopPluginInspect(pluginId)

  const host = address.host || '127.0.0.1'
  const port = address.port
    ? await getPort(address.port, host)
    : await getPort(undefined, host)

  if (address.port && port !== address.port) {
    throw new Error(`Inspect port ${address.port} is already in use`)
  }

  const id = uuid()
  const url = `ws://${displayHost(host)}:${port}/${id}`
  const clients = new Set<WebSocket>()
  const wss = new WebSocketServer({ noServer: true })

  const onDebuggerMessage = (
    _event: Electron.Event,
    method: string,
    params: unknown,
    sessionId: string
  ) => {
    const message: Record<string, unknown> = { method, params }
    if (sessionId) {
      message.sessionId = sessionId
    }
    const data = JSON.stringify(message)
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }

  const onDetach = () => {
    stopPluginInspect(pluginId)
  }

  const onDestroyed = () => {
    stopPluginInspect(pluginId)
  }

  const server = http.createServer((req, res) => {
    const session = sessions.get(pluginId)
    if (!session) {
      res.writeHead(404)
      res.end()
      return
    }
    const pathname = (req.url || '/').split('?')[0]
    if (pathname === '/json' || pathname === '/json/list') {
      sendJson(res, [buildTarget(session)])
      return
    }
    if (pathname === '/json/version') {
      sendJson(res, {
        Browser: `Tinker/${VERSION}`,
        'Protocol-Version': '1.3',
        webSocketDebuggerUrl: session.url,
      })
      return
    }
    res.writeHead(404)
    res.end()
  })

  const session: InspectSession = {
    id,
    host,
    port,
    url,
    title: options.title || pluginId,
    pageUrl: options.pageUrl || `plugin://${pluginId}/`,
    server,
    wss,
    webContents,
    clients,
    onDebuggerMessage,
    onDetach,
    onDestroyed,
  }
  sessions.set(pluginId, session)

  server.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '/').split('?')[0]
    if (pathname !== `/${id}`) {
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      closeClients(session)
      clients.add(ws)

      ws.on('message', async (raw) => {
        let msg: {
          id?: number
          method?: string
          params?: unknown
          sessionId?: string
        }
        try {
          msg = JSON.parse(raw.toString())
        } catch {
          return
        }
        if (msg.id === undefined || !msg.method) {
          return
        }
        try {
          if (webContents.isDestroyed() || !webContents.debugger.isAttached()) {
            throw new Error('Debugger is not attached')
          }
          const result = await webContents.debugger.sendCommand(
            msg.method,
            msg.params as any,
            msg.sessionId
          )
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ id: msg.id, result: result ?? {} }))
          }
        } catch (err: any) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                id: msg.id,
                error: {
                  code: -32000,
                  message: err?.message || String(err),
                },
              })
            )
          }
        }
      })

      ws.on('close', () => {
        clients.delete(ws)
      })
    })
  })

  try {
    attachDebugger(webContents)
    webContents.debugger.on('message', onDebuggerMessage)
    webContents.debugger.on('detach', onDetach)
    webContents.on('destroyed', onDestroyed)

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.once('listening', () => resolve())
      server.listen(port, host)
    })
  } catch (err) {
    stopPluginInspect(pluginId)
    throw err
  }

  return url
}
