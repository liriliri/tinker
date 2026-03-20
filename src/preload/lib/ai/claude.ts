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
  apiUrl = apiUrl.trim()
  if (apiUrl === 'https://api.anthropic.com') {
    apiUrl = `${apiUrl}/v1`
  }
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1)
  }
  return apiUrl
}

function convertMessage(message: AiMessage): Record<string, unknown> {
  // tool result → user message with tool_result block
  if (message.role === 'tool') {
    return {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: message.tool_call_id,
          content:
            typeof message.content === 'string'
              ? message.content
              : (message.content ?? [])
                  .filter((p) => p.type === 'text')
                  .map((p) => p.text)
                  .join(''),
        },
      ],
    }
  }

  // assistant message with tool_calls
  if (
    message.role === 'assistant' &&
    message.tool_calls &&
    message.tool_calls.length > 0
  ) {
    const content: unknown[] = []
    const text =
      typeof message.content === 'string'
        ? message.content
        : (message.content ?? [])
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('')
    if (text) content.push({ type: 'text', text })
    for (const tc of message.tool_calls) {
      let input: unknown = {}
      try {
        input = JSON.parse(tc.function.arguments || '{}')
      } catch {
        // keep empty object on parse failure
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
      model: this.provider.model,
      max_tokens: option.maxTokens ?? 8096,
      messages: otherMessages.map(convertMessage),
      stream,
    }

    if (systemMessages.length > 0) {
      body.system = systemMessages
        .map((m) =>
          typeof m.content === 'string'
            ? m.content
            : (m.content ?? [])
                .filter((p) => p.type === 'text')
                .map((p) => p.text)
                .join('')
        )
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
    // index → partial tool_use block
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
        const trimmed = line.trim()

        if (trimmed.startsWith('event:')) {
          pendingEvent = trimmed.slice(6).trim()
          continue
        }

        if (!trimmed.startsWith('data:')) continue
        const dataStr = trimmed.slice(5).trim()
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
            const toolCalls =
              Object.keys(toolBlocksMap).length > 0
                ? Object.values(toolBlocksMap).map((tb) => ({
                    id: tb.id,
                    type: 'function' as const,
                    function: { name: tb.name, arguments: tb.inputJson },
                  }))
                : undefined
            onChunk({ done: true, tool_calls: toolCalls })
            return
          }
        } catch {
          // ignore individual SSE parse errors
        }
      }
    }

    // stream ended without message_stop
    const toolCalls =
      Object.keys(toolBlocksMap).length > 0
        ? Object.values(toolBlocksMap).map((tb) => ({
            id: tb.id,
            type: 'function' as const,
            function: { name: tb.name, arguments: tb.inputJson },
          }))
        : undefined
    onChunk({ done: true, tool_calls: toolCalls })
  }
}
