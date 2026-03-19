import mainObj from 'share/preload/main'
import uuid from 'licia/uuid'

export interface AiProvider {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  model: string
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

const abortControllers = new Map<string, AbortController>()

async function getProviders(): Promise<AiProvider[]> {
  const raw = await mainObj.getSettingsStore('aiProviders')
  if (!raw) return []
  try {
    return JSON.parse(raw as string)
  } catch {
    return []
  }
}

async function findProvider(providerId?: string): Promise<AiProvider | null> {
  const providers = await getProviders()
  if (!providers.length) return null
  if (providerId) {
    return providers.find((p) => p.id === providerId) ?? providers[0]
  }
  return providers[0]
}

function buildRequestBody(
  provider: AiProvider,
  option: AiCallOption,
  stream: boolean
) {
  const body: Record<string, unknown> = {
    model: provider.model,
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

export async function callAI(option: AiCallOption): Promise<AiResult> {
  const provider = await findProvider(option.provider)
  if (!provider) {
    return { success: false, error: 'No AI provider configured' }
  }

  try {
    const response = await fetch(`${provider.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(provider, option, false)),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message as AiMessage | undefined
    if (!message) {
      return { success: false, error: 'Invalid response format' }
    }

    return { success: true, data: message }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) }
  }
}

export function callAIStream(
  option: AiCallOption,
  onChunk: (chunk: AiChunk) => void
): { promise: Promise<void>; requestId: string } {
  const requestId = uuid()
  let resolveStream!: () => void
  let rejectStream!: (err: Error) => void

  const promise = new Promise<void>((resolve, reject) => {
    resolveStream = resolve
    rejectStream = reject
  })

  ;(async () => {
    const provider = await findProvider(option.provider)
    if (!provider) {
      onChunk({ error: 'No AI provider configured', done: true })
      rejectStream(new Error('No AI provider configured'))
      return
    }

    const controller = new AbortController()
    abortControllers.set(requestId, controller)

    try {
      const response = await fetch(`${provider.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(buildRequestBody(provider, option, true)),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        const err = `HTTP ${response.status}: ${errorText}`
        onChunk({ error: err, done: true })
        rejectStream(new Error(err))
        return
      }

      if (!response.body) {
        onChunk({ error: 'No response body', done: true })
        rejectStream(new Error('No response body'))
        return
      }

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
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const dataStr = trimmed.slice(5).trim()
          if (dataStr === '[DONE]') {
            const toolCalls =
              Object.keys(toolCallsMap).length > 0
                ? Object.values(toolCallsMap)
                : undefined
            onChunk({ done: true, tool_calls: toolCalls })
            resolveStream()
            return
          }

          try {
            const parsed = JSON.parse(dataStr)
            const delta = parsed.choices?.[0]?.delta
            if (!delta) continue

            const chunk: AiChunk = {}

            if (delta.content) {
              chunk.content = delta.content
            }
            if (delta.reasoning_content) {
              chunk.reasoning_content = delta.reasoning_content
            }

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
                if (tc.function?.name) {
                  toolCallsMap[idx].function.name += tc.function.name
                }
                if (tc.function?.arguments) {
                  toolCallsMap[idx].function.arguments += tc.function.arguments
                }
              }
            }

            if (Object.keys(chunk).length > 0) {
              onChunk(chunk)
            }
          } catch {
            // ignore parse errors for individual SSE lines
          }
        }
      }

      const toolCalls =
        Object.keys(toolCallsMap).length > 0
          ? Object.values(toolCallsMap)
          : undefined
      onChunk({ done: true, tool_calls: toolCalls })
      resolveStream()
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onChunk({ error: 'Request aborted', done: true })
        rejectStream(new Error('Request aborted'))
      } else {
        onChunk({ error: err.message || String(err), done: true })
        rejectStream(err)
      }
    } finally {
      abortControllers.delete(requestId)
    }
  })()

  return { promise, requestId }
}

export function abortAI(requestId: string): void {
  const controller = abortControllers.get(requestId)
  if (controller) {
    controller.abort()
    abortControllers.delete(requestId)
  }
}
