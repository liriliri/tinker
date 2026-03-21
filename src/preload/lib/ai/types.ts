export type AiApiType = 'openai' | 'claude'

export interface AiModel {
  name: string
  capabilities?: string[]
  contextWindow?: number
  maxOutput?: number
}

export interface AiProvider {
  name: string
  apiUrl: string
  apiKey: string
  models: AiModel[]
  apiType?: AiApiType
}

export interface AiMessage {
  role: string
  content?: string | AiContentPart[]
  reasoningContent?: string
  toolCalls?: AiToolCall[]
  toolCallId?: string
}

export interface AiContentPart {
  type: string
  text?: string
}

export interface AiToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface AiCallOption {
  provider?: string
  model?: string
  messages: AiMessage[]
  tools?: AiTool[]
  temperature?: number
  maxTokens?: number
}

export interface AiTool {
  type: string
  function: {
    name: string
    description?: string
    parameters?: object
  }
}

export interface AiResult {
  success: boolean
  data?: AiMessage
  error?: string
}

export interface AiChunk {
  content?: string
  reasoningContent?: string
  toolCalls?: AiToolCall[]
  done?: boolean
  error?: string
}
