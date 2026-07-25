import map from 'licia/map'
import sleep from 'licia/sleep'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { isValidWsUrl } from './lib/format'
import type { Store } from './store'
import type { MessageFilter, WsConnection, WsMessage } from './types'
import pkg from '../package.json'

interface ConnectArgs {
  url: string
  timeout_ms?: number
}

interface ConnectionArgs {
  connection_id?: string
}

interface GetArgs extends ConnectionArgs {
  limit?: number
  filter?: MessageFilter
}

interface SendArgs extends ConnectionArgs {
  data: string
}

const DEFAULT_CONNECT_TIMEOUT_MS = 10000

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    connect,
    list: (store) => listConnections(store),
    get: getConnection,
    send: sendMessage,
    disconnect: disconnectConnection,
    clear_messages: clearMessages,
  })
}

function requireConnection(store: Store, connectionId?: string): WsConnection {
  const conn = connectionId
    ? store.connections.find((item) => item.id === connectionId)
    : store.selectedConnection

  if (!conn) {
    if (connectionId) {
      throw new Error(`Connection not found: ${connectionId}`)
    }
    throw new Error('No connection selected. Call connect first.')
  }

  return conn
}

function serializeMessage(message: WsMessage) {
  return {
    id: message.id,
    direction: message.direction,
    data: message.isBinary ? `[binary ${message.size} bytes]` : message.data,
    timestamp: message.timestamp,
    size: message.size,
    isBinary: message.isBinary,
  }
}

function serializeConnection(
  conn: WsConnection,
  options?: { limit?: number; filter?: MessageFilter }
) {
  let messages = conn.messages.slice()
  if (options?.filter && options.filter !== 'all') {
    messages = messages.filter((m) => m.direction === options.filter)
  }

  const limit = options?.limit
  if (limit !== undefined && limit >= 0) {
    messages = messages.slice(-limit)
  }

  return {
    id: conn.id,
    url: conn.url,
    status: conn.status,
    error: conn.error || null,
    createdAt: conn.createdAt,
    messageCount: conn.messages.length,
    messages: map(messages, serializeMessage),
  }
}

function listConnections(store: Store) {
  return {
    selectedConnectionId: store.selectedConnectionId,
    connections: map(store.connections, (conn) => ({
      id: conn.id,
      url: conn.url,
      status: conn.status,
      error: conn.error || null,
      createdAt: conn.createdAt,
      messageCount: conn.messages.length,
    })),
  }
}

async function waitForSettled(
  store: Store,
  connectionId: string,
  timeoutMs: number
) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const conn = store.connections.find((item) => item.id === connectionId)
    if (!conn) {
      throw new Error(`Connection not found: ${connectionId}`)
    }
    if (conn.status !== 'connecting') {
      return conn
    }
    await sleep(50)
  }
  throw new Error(`Timed out waiting for WebSocket after ${timeoutMs}ms`)
}

async function waitForClosed(
  store: Store,
  connectionId: string,
  timeoutMs: number
) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const conn = store.connections.find((item) => item.id === connectionId)
    if (!conn) {
      throw new Error(`Connection not found: ${connectionId}`)
    }
    if (conn.status === 'closed' || conn.status === 'error') {
      return conn
    }
    await sleep(50)
  }
  throw new Error(`Timed out waiting for disconnect after ${timeoutMs}ms`)
}

async function connect(store: Store, args: ConnectArgs) {
  if (!isValidWsUrl(args.url)) {
    throw new Error(
      'Invalid WebSocket URL. Use a ws:// or wss:// URL, e.g. wss://ws.postman-echo.com/raw'
    )
  }

  const id = store.connect(args.url)
  if (!id) {
    throw new Error(`Failed to connect to ${args.url}`)
  }

  const timeoutMs = args.timeout_ms ?? DEFAULT_CONNECT_TIMEOUT_MS
  const conn = await waitForSettled(store, id, timeoutMs)
  if (conn.status !== 'open') {
    throw new Error(
      conn.error || `WebSocket connection failed with status "${conn.status}"`
    )
  }

  return {
    ...serializeConnection(conn, { limit: 20 }),
    selectedConnectionId: store.selectedConnectionId,
  }
}

function getConnection(store: Store, args: GetArgs) {
  const conn = requireConnection(store, args.connection_id)
  if (args.connection_id) {
    store.selectConnection(args.connection_id)
  }

  return {
    selectedConnectionId: store.selectedConnectionId,
    connection: serializeConnection(conn, {
      limit: args.limit ?? 50,
      filter: args.filter,
    }),
  }
}

function sendMessage(store: Store, args: SendArgs) {
  const conn = requireConnection(store, args.connection_id)
  if (args.connection_id) {
    store.selectConnection(args.connection_id)
  }

  if (conn.status !== 'open') {
    throw new Error(
      `Connection is not open (status: ${conn.status}). Call connect first.`
    )
  }

  const ok = store.sendMessage(args.data)
  if (!ok) {
    throw new Error('Failed to send message.')
  }

  return {
    sent: true,
    connection: serializeConnection(requireConnection(store, conn.id), {
      limit: 20,
      filter: 'all',
    }),
  }
}

async function disconnectConnection(store: Store, args: ConnectionArgs) {
  const conn = requireConnection(store, args.connection_id)
  if (
    conn.status !== 'open' &&
    conn.status !== 'connecting' &&
    conn.status !== 'closing'
  ) {
    return {
      disconnected: false,
      connection: serializeConnection(conn, { limit: 20 }),
    }
  }

  store.disconnect(conn.id)
  const settled = await waitForClosed(store, conn.id, 5000)
  return {
    disconnected: true,
    connection: serializeConnection(settled, { limit: 20 }),
  }
}

function clearMessages(store: Store, args: ConnectionArgs) {
  const conn = requireConnection(store, args.connection_id)
  store.clearMessages(conn.id)
  return {
    cleared: true,
    connection: serializeConnection(requireConnection(store, conn.id), {
      limit: 20,
    }),
  }
}
