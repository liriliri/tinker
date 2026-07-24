import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import trim from 'licia/trim'
import isStr from 'licia/isStr'
import isErr from 'licia/isErr'
import isStrBlank from 'licia/isStrBlank'
import toStr from 'licia/toStr'
import contain from 'licia/contain'
import filter from 'licia/filter'
import find from 'licia/find'
import some from 'licia/some'
import convertBin from 'licia/convertBin'
import i18n from 'i18next'
import BaseStore from 'share/store/Base'
import { getByteSize, isValidWsUrl } from './lib/format'
import type {
  ConnectionStatus,
  DetailViewMode,
  MessageFilter,
  WsConnection,
  WsMessage,
} from './types'

const storage = new LocalStore('tinker-websocket')
const STORAGE_URL_HISTORY = 'urlHistory'
const STORAGE_LAST_URL = 'lastUrl'
const MAX_MESSAGES = 2000
const MAX_URL_HISTORY = 30

class Store extends BaseStore {
  url = ''
  connections: WsConnection[] = []
  selectedConnectionId: string | null = null
  selectedMessageId: string | null = null
  messageFilter: MessageFilter = 'all'
  messageSearch = ''
  composeText = ''
  detailViewMode: DetailViewMode = 'text'
  urlHistory: string[] = []

  private sockets = new Map<string, WebSocket>()

  constructor() {
    super()
    makeAutoObservable(this, {}, { autoBind: true })
    this.loadStorage()
  }

  private loadStorage() {
    this.urlHistory = storage.get(STORAGE_URL_HISTORY) || []
    this.url = storage.get(STORAGE_LAST_URL) || ''
  }

  private saveUrlHistory() {
    storage.set(STORAGE_URL_HISTORY, this.urlHistory)
  }

  private errMessage(err: unknown): string {
    return isErr(err) ? err.message : toStr(err)
  }

  get selectedConnection(): WsConnection | null {
    if (!this.selectedConnectionId) return null
    return (
      find(this.connections, (c) => c.id === this.selectedConnectionId) || null
    )
  }

  get selectedMessage(): WsMessage | null {
    const conn = this.selectedConnection
    if (!conn || !this.selectedMessageId) return null
    return find(conn.messages, (m) => m.id === this.selectedMessageId) || null
  }

  get filteredMessages(): WsMessage[] {
    const conn = this.selectedConnection
    if (!conn) return []

    let list = conn.messages.slice()
    if (this.messageFilter !== 'all') {
      list = filter(list, (m) => m.direction === this.messageFilter)
    }

    const q = trim(this.messageSearch).toLowerCase()
    if (q) {
      list = filter(list, (m) => contain(m.data.toLowerCase(), q))
    }

    return list
  }

  get canSend(): boolean {
    const conn = this.selectedConnection
    return !!conn && conn.status === 'open' && !isStrBlank(this.composeText)
  }

  get canSendBinary(): boolean {
    const conn = this.selectedConnection
    return !!conn && conn.status === 'open'
  }

  get hasActiveConnections(): boolean {
    return some(
      this.connections,
      (c) =>
        c.status === 'open' ||
        c.status === 'connecting' ||
        c.status === 'closing'
    )
  }

  setUrl(url: string) {
    this.url = url
    storage.set(STORAGE_LAST_URL, url)
  }

  setMessageFilter(value: MessageFilter) {
    this.messageFilter = value
  }

  setMessageSearch(search: string) {
    this.messageSearch = search
  }

  setComposeText(text: string) {
    this.composeText = text
  }

  setDetailViewMode(mode: DetailViewMode) {
    this.detailViewMode = mode
  }

  selectConnection(id: string) {
    this.selectedConnectionId = id
    this.selectedMessageId = null
    this.detailViewMode = 'text'
  }

  selectMessage(id: string | null) {
    this.selectedMessageId = id
    const msg = this.selectedMessage
    this.detailViewMode = msg?.isBinary ? 'hex' : 'text'
  }

  private pushUrlHistory(url: string) {
    this.urlHistory = [url, ...filter(this.urlHistory, (u) => u !== url)].slice(
      0,
      MAX_URL_HISTORY
    )
    this.saveUrlHistory()
  }

  clearUrlHistory() {
    this.urlHistory = []
    this.saveUrlHistory()
  }

  private findConnection(id: string): WsConnection | undefined {
    return find(this.connections, (c) => c.id === id)
  }

  private setStatus(id: string, status: ConnectionStatus, error = '') {
    const conn = this.findConnection(id)
    if (!conn) return
    conn.status = status
    conn.error = error
  }

  private appendMessage(id: string, message: WsMessage) {
    const conn = this.findConnection(id)
    if (!conn) return
    conn.messages = [...conn.messages, message]
    if (conn.messages.length > MAX_MESSAGES) {
      conn.messages = conn.messages.slice(-MAX_MESSAGES)
    }
  }

  private createSystemMessage(data: string): WsMessage {
    return {
      id: uuid(),
      direction: 'system',
      data,
      timestamp: Date.now(),
      size: getByteSize(data),
      isBinary: false,
    }
  }

  private appendSendError(connId: string, err: unknown) {
    this.appendMessage(
      connId,
      this.createSystemMessage(
        i18n.t('sendFailed', { message: this.errMessage(err) })
      )
    )
  }

  private async normalizePayload(data: string | ArrayBuffer | Blob): Promise<{
    text: string
    isBinary: boolean
    size: number
    bytes?: number[]
  }> {
    if (isStr(data)) {
      return { text: data, isBinary: false, size: getByteSize(data) }
    }
    const buffer = data instanceof ArrayBuffer ? data : await data.arrayBuffer()
    const bytes = convertBin(buffer, 'Array') as number[]
    return { text: '', isBinary: true, size: bytes.length, bytes }
  }

  connect(urlOverride?: string) {
    const url = trim(urlOverride ?? this.url)
    if (!isValidWsUrl(url)) return

    this.setUrl(url)

    const id = uuid()
    const conn: WsConnection = {
      id,
      url,
      status: 'connecting',
      messages: [],
      error: '',
      createdAt: Date.now(),
    }

    this.connections = [conn, ...this.connections]
    this.selectedConnectionId = id
    this.selectedMessageId = null
    this.pushUrlHistory(url)

    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch (err) {
      conn.status = 'error'
      conn.error = this.errMessage(err)
      this.appendMessage(
        id,
        this.createSystemMessage(
          i18n.t('connectError', { message: conn.error })
        )
      )
      return
    }

    this.sockets.set(id, ws)
    ws.binaryType = 'arraybuffer'

    ws.addEventListener('open', () => {
      runInAction(() => {
        this.setStatus(id, 'open')
        this.appendMessage(
          id,
          this.createSystemMessage(i18n.t('connectionOpened'))
        )
      })
    })

    ws.addEventListener('message', (event) => {
      void this.normalizePayload(event.data).then(
        ({ text, isBinary, size, bytes }) => {
          runInAction(() => {
            this.appendMessage(id, {
              id: uuid(),
              direction: 'incoming',
              data: text,
              timestamp: Date.now(),
              size,
              isBinary,
              bytes,
            })
          })
        }
      )
    })

    ws.addEventListener('error', () => {
      runInAction(() => {
        this.setStatus(id, 'error', i18n.t('websocketError'))
        this.appendMessage(
          id,
          this.createSystemMessage(i18n.t('websocketError'))
        )
      })
    })

    ws.addEventListener('close', (event) => {
      runInAction(() => {
        const reason = event.reason
          ? i18n.t('closedWithReason', {
              code: event.code,
              reason: event.reason,
            })
          : i18n.t('closed', { code: event.code })
        this.setStatus(id, 'closed')
        this.appendMessage(id, this.createSystemMessage(reason))
        this.sockets.delete(id)
      })
    })
  }

  disconnect(id?: string) {
    const targetId = id || this.selectedConnectionId
    if (!targetId) return
    const ws = this.sockets.get(targetId)
    if (!ws) return
    this.setStatus(targetId, 'closing')
    ws.close()
  }

  disconnectAll() {
    for (const conn of this.connections) {
      if (
        conn.status === 'open' ||
        conn.status === 'connecting' ||
        conn.status === 'closing'
      ) {
        this.disconnect(conn.id)
      }
    }
  }

  removeConnection(id: string) {
    const ws = this.sockets.get(id)
    if (ws) {
      ws.close()
      this.sockets.delete(id)
    }
    this.connections = filter(this.connections, (c) => c.id !== id)
    if (this.selectedConnectionId === id) {
      this.selectedConnectionId = this.connections[0]?.id || null
      this.selectedMessageId = null
    }
  }

  removeAllConnections() {
    for (const conn of this.connections) {
      const ws = this.sockets.get(conn.id)
      if (ws) {
        ws.close()
        this.sockets.delete(conn.id)
      }
    }
    this.connections = []
    this.selectedConnectionId = null
    this.selectedMessageId = null
  }

  clearMessages() {
    const conn = this.selectedConnection
    if (!conn) return
    conn.messages = []
    this.selectedMessageId = null
  }

  sendMessage(data?: string) {
    const text = trim(data ?? this.composeText)
    const conn = this.selectedConnection
    if (!conn || conn.status !== 'open' || !text) return

    const ws = this.sockets.get(conn.id)
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    try {
      ws.send(text)
      this.appendMessage(conn.id, {
        id: uuid(),
        direction: 'outgoing',
        data: text,
        timestamp: Date.now(),
        size: getByteSize(text),
        isBinary: false,
      })
      if (data === undefined) this.composeText = ''
    } catch (err) {
      this.appendSendError(conn.id, err)
    }
  }

  sendBinary(buffer: ArrayBuffer, fileName?: string) {
    const conn = this.selectedConnection
    if (!conn || conn.status !== 'open') return

    const ws = this.sockets.get(conn.id)
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    try {
      ws.send(buffer)
      const bytes = convertBin(buffer, 'Array') as number[]
      this.appendMessage(conn.id, {
        id: uuid(),
        direction: 'outgoing',
        data: fileName || '',
        timestamp: Date.now(),
        size: bytes.length,
        isBinary: true,
        bytes,
      })
    } catch (err) {
      this.appendSendError(conn.id, err)
    }
  }
}

export default new Store()
