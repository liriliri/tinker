import type { ChatMessage as BaseChatMessage } from 'share/components/AiChat'
import type { SearchResult } from '../common/types'

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ChatMessage extends Omit<BaseChatMessage, 'role'> {
  role: 'user' | 'assistant' | 'tool'
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
