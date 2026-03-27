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

export type ToolStatus = 'running' | 'done' | 'error'

export interface ChatMessage extends Omit<BaseChatMessage, 'role'> {
  role: 'user' | 'assistant' | 'tool'
  toolCalls?: ToolCall[]
  toolCallId?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolStatus?: ToolStatus
  isSearching?: boolean
  searchQuery?: string
  searchResults?: SearchResult[]
}

export interface Session {
  messages: ChatMessage[]
  workingDir: string
}
