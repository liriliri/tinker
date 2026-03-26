import type { SearchResult } from '../common/types'

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  generating?: boolean
  error?: string
  // Tool call fields (assistant messages)
  toolCalls?: ToolCall[]
  // Tool result fields (tool messages)
  toolCallId?: string
  toolName?: string
  // Search UI state (tool messages)
  isSearching?: boolean
  searchQuery?: string
  searchResults?: SearchResult[]
}

export interface Session {
  id: string
  title: string
  messages: ChatMessage[]
  systemPrompt: string
  createdAt: number
}
