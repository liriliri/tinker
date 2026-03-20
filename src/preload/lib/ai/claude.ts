import isEmpty from 'licia/isEmpty'
import rtrim from 'licia/rtrim'
import trim from 'licia/trim'
import { AiAdapter } from './adapter'
import type {
  AiCallOption,
  AiChunk,
  AiMessage,
  AiProvider,
  AiTool,
  AiToolCall,
} from './types'

function normalizeApiUrl(apiUrl: string): string {
  apiUrl = trim(apiUrl)
  if (apiUrl === 'https://api.anthropic.com') {
    apiUrl = `${apiUrl}/v1`
  }
  return rtrim(apiUrl, '/')
}

function getTextContent(content?: AiMessage['content']): string {
  if (typeof content === 'string') {
    return content
  }

  return (content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

function getClaudeToolCalls(
  toolBlocksMap: Record<number, { id: string; name: string; inputJson: string }>
): AiToolCall[] | undefined {
  if (isEmpty(toolBlocksMap)) return undefined

  return Object.values(toolBlocksMap).map((toolBlock) => ({
    id: toolBlock.id,
    type: 'function',
    function: { name: toolBlock.name, arguments: toolBlock.inputJson },
  }))
}

function convertMessage(message: AiMessage): Record<string, unknown> {
  if (message.role === 'tool') {
    return {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: message.tool_call_id,
          content: getTextContent(message.content),
        },
      ],
    }
  }

  if (
    message.role === 'assistant' &&
    message.tool_calls &&
    message.tool_calls.length > 0
  ) {
    const content: unknown[] = []
    const text = getTextContent(message.content)
    if (text) content.push({ type: 'text', text })
    for (const tc of message.tool_calls) {
      let input: unknown = {}
      try {
        input = JSON.parse(tc.function.arguments || '{}')
      } catch {
        // ignore
      }
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input,
      })
    }
    return { role: 'assistant', content }
  }

  return { role: message.role, content: message.content ?? '' }
}

function convertTools(tools: AiTool[]): unknown[] {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters ?? {
      type: 'object',
      properties: {},
    },
  }))
}

function parseResponse(data: Record<string, unknown>): AiMessage {
  const blocks = (data.content ?? []) as Array<{
    type: string
    text?: string
    id?: string
    name?: string
    input?: unknown
  }>

  let text = ''
  const toolCalls: AiToolCall[] = []

  for (const block of blocks) {
    if (block.type === 'text') {
      text += block.text ?? ''
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id ?? '',
        type: 'function',
        function: {
          name: block.name ?? '',
          arguments: JSON.stringify(block.input ?? {}),
        },
      })
    }
  }

  const message: AiMessage = { role: 'assistant', content: text }
  if (toolCalls.length > 0) message.tool_calls = toolCalls
  return message
}

export class ClaudeAdapter extends AiAdapter {
  private baseUrl: string

  constructor(provider: AiProvider) {
    super(provider)
    this.baseUrl = normalizeApiUrl(provider.apiUrl)
  }

  private get endpoint() {
    return `${this.baseUrl}/messages`
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.provider.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }
  }

  private buildBody(
    option: AiCallOption,
    stream: boolean
  ): Record<string, unknown> {
    const systemMessages = option.messages.filter((m) => m.role === 'system')
    const otherMessages = option.messages.filter((m) => m.role !== 'system')

    const body: Record<string, unknown> = {
      model: option.model ?? this.provider.models[0]?.name ?? '',
      max_tokens: option.maxTokens ?? 8096,
      messages: otherMessages.map(convertMessage),
      stream,
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages
        .map((m) => getTextContent(m.content))
        .join('\n')
    }

    if (option.tools && option.tools.length > 0) {
      body.tools = convertTools(option.tools)
    }

    if (option.temperature !== undefined) {
      body.temperature = option.temperature
    }

    return body
  }

  async call(option: AiCallOption): Promise<AiMessage> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(this.buildBody(option, false)),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return parseResponse(await response.json())
  }

  async stream(
    option: AiCallOption,
    onChunk: (chunk: AiChunk) => void,
    signal: AbortSignal
  ): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(this.buildBody(option, true)),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const toolBlocksMap: Record<
      number,
      { id: string; name: string; inputJson: string }
    > = {}

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      let pendingEvent = ''
      for (const line of lines) {
        const trimmed = trim(line)

        if (trimmed.startsWith('event:')) {
          pendingEvent = trim(trimmed.slice(6))
          continue
        }

        if (!trimmed.startsWith('data:')) continue
        const dataStr = trim(trimmed.slice(5))
        if (!dataStr) continue

        try {
          const parsed = JSON.parse(dataStr)
          const eventType = pendingEvent || parsed.type
          pendingEvent = ''

          if (eventType === 'content_block_start') {
            const idx: number = parsed.index ?? 0
            const block = parsed.content_block ?? {}
            if (block.type === 'tool_use') {
              toolBlocksMap[idx] = {
                id: block.id ?? '',
                name: block.name ?? '',
                inputJson: '',
              }
            }
          } else if (eventType === 'content_block_delta') {
            const idx: number = parsed.index ?? 0
            const delta = parsed.delta ?? {}
            if (delta.type === 'text_delta' && delta.text) {
              onChunk({ content: delta.text })
            } else if (
              delta.type === 'input_json_delta' &&
              delta.partial_json
            ) {
              if (toolBlocksMap[idx])
                toolBlocksMap[idx].inputJson += delta.partial_json
            }
          } else if (eventType === 'message_stop') {
            onChunk({
              done: true,
              tool_calls: getClaudeToolCalls(toolBlocksMap),
            })
            return
          }
        } catch {
          // ignore
        }
      }
    }

    onChunk({ done: true, tool_calls: getClaudeToolCalls(toolBlocksMap) })
  }
}
