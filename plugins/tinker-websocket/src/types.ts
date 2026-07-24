export type ConnectionStatus =
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'error'

export type MessageDirection = 'outgoing' | 'incoming' | 'system'

export type MessageFilter = 'all' | 'outgoing' | 'incoming'

export type DetailViewMode = 'text' | 'hex'

export interface WsMessage {
  id: string
  direction: MessageDirection
  data: string
  timestamp: number
  size: number
  isBinary: boolean
  bytes?: number[]
}

export interface WsConnection {
  id: string
  url: string
  status: ConnectionStatus
  messages: WsMessage[]
  error: string
  createdAt: number
}
