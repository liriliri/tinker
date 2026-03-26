import type {
  LanguageModelV3FunctionTool,
  LanguageModelV3Message,
  LanguageModelV3TextPart,
  LanguageModelV3ToolCallPart,
  LanguageModelV3ToolResultPart,
} from '@ai-sdk/provider'
import type { AiCallOption, AiMessage, AiToolCall } from './types'

function getTextContent(content: AiMessage['content']): string {
  if (typeof content === 'string') return content
  return (content ?? [])
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('')
}

export function convertMessages(
  messages: AiMessage[]
): LanguageModelV3Message[] {
  return messages.map((msg) => {
    if (msg.role === 'system') {
      return { role: 'system', content: getTextContent(msg.content) }
    }

    if (msg.role === 'user') {
      return {
        role: 'user',
        content: [{ type: 'text', text: getTextContent(msg.content) }],
      }
    }

    if (msg.role === 'assistant') {
      const content: Array<
        LanguageModelV3TextPart | LanguageModelV3ToolCallPart
      > = []
      const text = getTextContent(msg.content)
      if (text) content.push({ type: 'text', text })
      for (const tc of msg.toolCalls ?? []) {
        let input: unknown = {}
        try {
          input = JSON.parse(tc.function.arguments || '{}')
        } catch {
          // ignore
        }
        content.push({
          type: 'tool-call',
          toolCallId: tc.id,
          toolName: tc.function.name,
          input,
        })
      }
      return { role: 'assistant', content }
    }

    // role === 'tool'
    const toolResult: LanguageModelV3ToolResultPart = {
      type: 'tool-result',
      toolCallId: msg.toolCallId ?? '',
      toolName: msg.toolName ?? '',
      output: { type: 'text', value: getTextContent(msg.content) },
    }
    return { role: 'tool', content: [toolResult] }
  })
}

export function convertTools(
  tools: AiCallOption['tools']
): LanguageModelV3FunctionTool[] | undefined {
  if (!tools?.length) return undefined
  return tools.map((t) => ({
    type: 'function' as const,
    name: t.function.name,
    description: t.function.description,
    inputSchema: (t.function.parameters ?? {
      type: 'object',
      properties: {},
    }) as LanguageModelV3FunctionTool['inputSchema'],
  }))
}

export function buildToolCalls(
  map: Record<string, { id: string; name: string; inputJson: string }>
): AiToolCall[] | undefined {
  const entries = Object.values(map)
  if (!entries.length) return undefined
  return entries.map((tc) => ({
    id: tc.id,
    type: 'function' as const,
    function: { name: tc.name, arguments: tc.inputJson },
  }))
}
