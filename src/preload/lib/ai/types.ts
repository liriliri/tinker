export type AiApiType = 'openai' | 'claude'

export interface AiProvider {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  model: string
  apiType?: AiApiType
}

export interface AiMessage {
  role: string
  content?: string | AiContentPart[]
  reasoning_content?: string
  tool_calls?: AiToolCall[]
  tool_call_id?: string
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
  reasoning_content?: string
  tool_calls?: AiToolCall[]
  done?: boolean
  error?: string
}
