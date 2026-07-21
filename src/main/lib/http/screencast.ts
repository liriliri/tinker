import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { WebContents } from 'electron'
import clamp from 'licia/clamp'
import defaults from 'licia/defaults'
import each from 'licia/each'
import isStr from 'licia/isStr'
import toBool from 'licia/toBool'
import toNum from 'licia/toNum'
import { hasPluginInspect } from '../plugin/inspect'
import { pluginViews } from '../plugin/view'
import { checkRequestAuth, HttpAuth } from './auth'

interface PluginSession {
  pluginId: string
  webContents: WebContents
  clients: Set<WebSocket>
  attachedByUs: boolean
  screencastOn: boolean
  touchMode: boolean
  cdpVisible: boolean
  onDebuggerMessage: (
    event: Electron.Event,
    method: string,
    params: unknown
  ) => void
  onDestroyed: () => void
  unbindWindow: (() => void) | null
}

const pluginSessions = new Map<string, PluginSession>()

function attachDebugger(wc: WebContents) {
  if (!wc.debugger.isAttached()) {
    wc.debugger.attach('1.3')
    return true
  }
  return false
}

function detachDebugger(wc: WebContents) {
  try {
    if (!wc.isDestroyed() && wc.debugger.isAttached()) {
      wc.debugger.detach()
    }
  } catch {
    // already detached
  }
}

function isPluginInForeground(pluginId: string) {
  const entry = pluginViews[pluginId]
  if (!entry) return false
  const win = entry.win
  if (!win || win.isDestroyed()) return false
  return win.isVisible() && !win.isMinimized()
}

function isSessionActive(session: PluginSession) {
  return session.cdpVisible && isPluginInForeground(session.pluginId)
}

function broadcast(session: PluginSession, payload: unknown) {
  const raw = JSON.stringify(payload)
  for (const client of session.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw)
    }
  }
}

function broadcastVisibility(session: PluginSession) {
  broadcast(session, {
    type: 'visibility',
    visible: isSessionActive(session),
  })
}

function bindWindow(session: PluginSession) {
  session.unbindWindow?.()
  session.unbindWindow = null

  const entry = pluginViews[session.pluginId]
  const win = entry?.win
  if (!win || win.isDestroyed()) {
    broadcastVisibility(session)
    return
  }

  const update = () => broadcastVisibility(session)
  const events = ['show', 'hide', 'minimize', 'restore'] as const
  each(events, (event) => {
    win.on(event as any, update)
  })
  session.unbindWindow = () => {
    if (win.isDestroyed()) return
    each(events, (event) => {
      win.removeListener(event as any, update)
    })
  }
  broadcastVisibility(session)
}

async function stopScreencast(session: PluginSession) {
  if (!session.screencastOn) return
  session.screencastOn = false
  try {
    if (
      !session.webContents.isDestroyed() &&
      session.webContents.debugger.isAttached()
    ) {
      await session.webContents.debugger.sendCommand('Page.stopScreencast')
    }
  } catch {
    // ignore
  }
}

async function startScreencast(
  session: PluginSession,
  width?: number,
  height?: number
) {
  const w = Math.floor(clamp(width || 1280, 1, 2048))
  const h = Math.floor(clamp(height || 800, 1, 2048))
  await stopScreencast(session)
  await session.webContents.debugger.sendCommand('Page.startScreencast', {
    format: 'jpeg',
    quality: 80,
    maxWidth: w,
    maxHeight: h,
    everyNthFrame: 1,
  })
  session.screencastOn = true
}

async function setTouchMode(session: PluginSession, enabled: boolean) {
  if (session.touchMode === enabled) return
  if (
    session.webContents.isDestroyed() ||
    !session.webContents.debugger.isAttached()
  ) {
    return
  }
  // Match DevTools ScreencastView touch mode: mouse events are emitted as
  // touch so lists and other touch-scrollable content can scroll.
  await session.webContents.debugger.sendCommand(
    'Emulation.setTouchEmulationEnabled',
    {
      enabled,
      maxTouchPoints: 1,
    }
  )
  await session.webContents.debugger.sendCommand(
    'Emulation.setEmitTouchEventsForMouse',
    {
      enabled,
      configuration: 'mobile',
    }
  )
  session.touchMode = enabled
}

function disposePluginSession(pluginId: string) {
  const session = pluginSessions.get(pluginId)
  if (!session) return
  pluginSessions.delete(pluginId)

  session.unbindWindow?.()
  session.unbindWindow = null

  for (const client of session.clients) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'closed' }))
      }
      client.close()
    } catch {
      // ignore
    }
  }
  session.clients.clear()

  if (!session.webContents.isDestroyed()) {
    session.webContents.debugger.removeListener(
      'message',
      session.onDebuggerMessage
    )
    session.webContents.removeListener('destroyed', session.onDestroyed)
    void stopScreencast(session)
    if (session.attachedByUs && !hasPluginInspect(pluginId)) {
      detachDebugger(session.webContents)
    } else if (session.touchMode) {
      // Keep debugger for inspect; clear touch emulation so local mouse
      // input is not affected after remote clients disconnect.
      void setTouchMode(session, false).catch(() => {})
    }
  }
}

export function disposePluginHttpSession(pluginId: string) {
  disposePluginSession(pluginId)
}

export function disposeAllHttpSessions() {
  each([...pluginSessions.keys()], (id) => {
    disposePluginSession(id)
  })
}

function getOrCreateSession(pluginId: string): PluginSession {
  const existing = pluginSessions.get(pluginId)
  if (existing) return existing

  const entry = pluginViews[pluginId]
  if (!entry || entry.view.webContents.isDestroyed()) {
    throw new Error(`Plugin is not running: ${pluginId}`)
  }

  const webContents = entry.view.webContents
  const clients = new Set<WebSocket>()

  const onDebuggerMessage = (
    _event: Electron.Event,
    method: string,
    params: unknown
  ) => {
    const session = pluginSessions.get(pluginId)
    if (!session) return

    if (method === 'Page.screencastFrame') {
      const frame = params as {
        data: string
        metadata: unknown
        sessionId: number
      }
      void webContents.debugger
        .sendCommand('Page.screencastFrameAck', {
          sessionId: frame.sessionId,
        })
        .catch(() => {})
      broadcast(session, {
        type: 'frame',
        data: frame.data,
        metadata: frame.metadata,
      })
      return
    }

    if (method === 'Page.screencastVisibilityChanged') {
      const { visible } = params as { visible: boolean }
      session.cdpVisible = toBool(visible)
      broadcastVisibility(session)
    }
  }

  const onDestroyed = () => {
    disposePluginSession(pluginId)
  }

  const attachedByUs = attachDebugger(webContents)
  webContents.debugger.on('message', onDebuggerMessage)
  webContents.on('destroyed', onDestroyed)

  const session: PluginSession = {
    pluginId,
    webContents,
    clients,
    attachedByUs,
    screencastOn: false,
    touchMode: false,
    cdpVisible: true,
    onDebuggerMessage,
    onDestroyed,
    unbindWindow: null,
  }
  pluginSessions.set(pluginId, session)
  bindWindow(session)
  return session
}

async function handleClientMessage(session: PluginSession, raw: string) {
  let msg: {
    type?: string
    width?: number
    height?: number
    enabled?: boolean
    eventType?: string
    x?: number
    y?: number
    button?: string
    buttons?: number
    clickCount?: number
    modifiers?: number
    deltaX?: number
    deltaY?: number
    key?: string
    code?: string
    text?: string
    keyCode?: number
    autoRepeat?: boolean
    location?: number
  }
  try {
    msg = JSON.parse(raw)
  } catch {
    return
  }

  if (!msg.type) return

  if (msg.type === 'resize') {
    await startScreencast(session, msg.width, msg.height)
    return
  }

  if (msg.type === 'touchMode') {
    await setTouchMode(session, toBool(msg.enabled))
    return
  }

  // Block input while the plugin window is not in the foreground.
  if (!isSessionActive(session)) {
    return
  }

  if (msg.type === 'mouse') {
    const typeMap: Record<string, string> = {
      mousedown: 'mousePressed',
      mouseup: 'mouseReleased',
      mousemove: 'mouseMoved',
      wheel: 'mouseWheel',
    }
    const type = typeMap[msg.eventType || '']
    if (!type) return
    const params = defaults(
      {
        type,
        x: Math.round(toNum(msg.x) || 0),
        y: Math.round(toNum(msg.y) || 0),
        modifiers: msg.modifiers,
        button: msg.button,
        buttons: msg.buttons,
        clickCount: msg.clickCount,
      },
      {
        modifiers: 0,
        button: 'none',
        buttons: 0,
        clickCount: 0,
      }
    )
    if (type === 'mouseWheel') {
      params.deltaX = toNum(msg.deltaX) || 0
      params.deltaY = toNum(msg.deltaY) || 0
    }
    await session.webContents.debugger.sendCommand(
      'Input.dispatchMouseEvent',
      params
    )
    return
  }

  if (msg.type === 'insertText') {
    if (!isStr(msg.text) || !msg.text) return
    try {
      await session.webContents.insertText(msg.text)
    } catch {
      await session.webContents.debugger.sendCommand('Input.insertText', {
        text: msg.text,
      })
    }
    return
  }

  if (msg.type === 'key') {
    const typeMap: Record<string, string> = {
      keydown: 'keyDown',
      keyup: 'keyUp',
      keypress: 'char',
      char: 'char',
    }
    const type = typeMap[msg.eventType || '']
    if (!type) return
    const text =
      type === 'char'
        ? msg.text || (msg.key && msg.key.length === 1 ? msg.key : undefined)
        : undefined
    await session.webContents.debugger.sendCommand('Input.dispatchKeyEvent', {
      type,
      modifiers: toNum(msg.modifiers) || 0,
      text,
      unmodifiedText: text ? text.toLowerCase() : undefined,
      code: msg.code,
      key: msg.key,
      windowsVirtualKeyCode: msg.keyCode,
      nativeVirtualKeyCode: msg.keyCode,
      autoRepeat: toBool(msg.autoRepeat),
      location: toNum(msg.location) || 0,
    })
  }
}

function pathnameOf(url: string) {
  return (url || '/').split('?')[0]
}

export function handleUpgrade(
  wss: WebSocketServer,
  req: http.IncomingMessage,
  socket: import('stream').Duplex,
  head: Buffer,
  auth?: HttpAuth
) {
  const pathname = pathnameOf(req.url || '/')
  const match = pathname.match(/^\/ws\/([^/]+)\/?$/)
  if (!match) {
    socket.destroy()
    return
  }

  if (auth && !checkRequestAuth(req, auth)) {
    socket.write(
      'HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'
    )
    socket.destroy()
    return
  }

  const pluginId = decodeURIComponent(match[1])
  if (!pluginViews[pluginId]) {
    socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n')
    socket.destroy()
    return
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    let session: PluginSession
    try {
      session = getOrCreateSession(pluginId)
    } catch {
      ws.send(JSON.stringify({ type: 'closed' }))
      ws.close()
      return
    }

    session.clients.add(ws)
    broadcastVisibility(session)

    ws.on('message', (raw) => {
      void handleClientMessage(session, raw.toString()).catch((err: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: err?.message || String(err),
            })
          )
        }
      })
    })

    ws.on('close', () => {
      session.clients.delete(ws)
      if (session.clients.size === 0) {
        disposePluginSession(pluginId)
      }
    })
  })
}
