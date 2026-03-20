import { AiAdapter } from './adapter'
import type {
  AiCallOption,
  AiChunk,
  AiMessage,
  AiProvider,
  AiToolCall,
} from './types'

export class OpenAIAdapter extends AiAdapter {
  constructor(provider: AiProvider) {
    super(provider)
  }

  private get endpoint() {
    return `${this.provider.apiUrl}/chat/completions`
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.provider.apiKey}`,
    }
  }

  private buildBody(
    option: AiCallOption,
    stream: boolean
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.provider.model,
      messages: option.messages,
      stream,
    }
    if (option.tools && option.tools.length > 0) {
      body.tools = option.tools
    }
    if (option.temperature !== undefined) {
      body.temperature = option.temperature
    }
    if (option.maxTokens !== undefined) {
      body.max_tokens = option.maxTokens
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

    const data = await response.json()
    const message = data.choices?.[0]?.message as AiMessage | undefined
    if (!message) throw new Error('Invalid response format')
    return message
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
    const toolCallsMap: Record<number, AiToolCall> = {}

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const dataStr = trimmed.slice(5).trim()
        if (dataStr === '[DONE]') {
          const toolCalls =
            Object.keys(toolCallsMap).length > 0
              ? Object.values(toolCallsMap)
              : undefined
          onChunk({ done: true, tool_calls: toolCalls })
          return
        }

        try {
          const parsed = JSON.parse(dataStr)
          const delta = parsed.choices?.[0]?.delta
          if (!delta) continue

          const chunk: AiChunk = {}
          if (delta.content) chunk.content = delta.content
          if (delta.reasoning_content)
            chunk.reasoning_content = delta.reasoning_content

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0
              if (!toolCallsMap[idx]) {
                toolCallsMap[idx] = {
                  id: tc.id || '',
                  type: tc.type || 'function',
                  function: { name: '', arguments: '' },
                }
              }
              if (tc.id) toolCallsMap[idx].id = tc.id
              if (tc.function?.name)
                toolCallsMap[idx].function.name += tc.function.name
              if (tc.function?.arguments)
                toolCallsMap[idx].function.arguments += tc.function.arguments
            }
          }

          if (Object.keys(chunk).length > 0) onChunk(chunk)
        } catch {
          // ignore individual SSE parse errors
        }
      }
    }

    const toolCalls =
      Object.keys(toolCallsMap).length > 0
        ? Object.values(toolCallsMap)
        : undefined
    onChunk({ done: true, tool_calls: toolCalls })
  }
}
