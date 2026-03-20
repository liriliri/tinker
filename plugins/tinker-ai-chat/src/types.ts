export interface AiModel {
  name: string
  capabilities?: string[]
  contextWindow?: number
  maxOutput?: number
}

export interface AiProviderInfo {
  name: string
  models: AiModel[]
}

export interface AiMessage {
  role: string
  content?: string | unknown[]
  reasoning_content?: string
  tool_calls?: unknown[]
  tool_call_id?: string
}

export interface AiStreamTask extends Promise<void> {
  abort(): void
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  generating?: boolean
  error?: string
}

export interface Session {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}
