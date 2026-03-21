import type { LanguageModelV3 } from '@ai-sdk/provider'
import type { AiCallOption, AiChunk, AiMessage, AiProvider } from './types'
import { buildToolCalls, convertMessages, convertTools } from './util'

export abstract class AiAdapter {
  constructor(protected provider: AiProvider) {}

  protected abstract getModel(option: AiCallOption): LanguageModelV3

  async call(option: AiCallOption): Promise<AiMessage> {
    const model = this.getModel(option)
    const result = await model.doGenerate({
      prompt: convertMessages(option.messages),
      tools: convertTools(option.tools),
      ...(option.temperature !== undefined && {
        temperature: option.temperature,
      }),
      ...(option.maxTokens !== undefined && {
        maxOutputTokens: option.maxTokens,
      }),
    })

    let text = ''
    const toolCalls: AiMessage['toolCalls'] = []
    for (const part of result.content) {
      if (part.type === 'text') {
        text += part.text
      } else if (part.type === 'tool-call') {
        toolCalls.push({
          id: part.toolCallId,
          type: 'function',
          function: { name: part.toolName, arguments: part.input as string },
        })
      }
    }

    const message: AiMessage = { role: 'assistant', content: text }
    if (toolCalls.length > 0) message.toolCalls = toolCalls
    return message
  }

  async stream(
    option: AiCallOption,
    onChunk: (chunk: AiChunk) => void,
    signal: AbortSignal
  ): Promise<void> {
    const model = this.getModel(option)
    const { stream } = await model.doStream({
      prompt: convertMessages(option.messages),
      tools: convertTools(option.tools),
      abortSignal: signal,
      ...(option.temperature !== undefined && {
        temperature: option.temperature,
      }),
      ...(option.maxTokens !== undefined && {
        maxOutputTokens: option.maxTokens,
      }),
    })

    const toolCallsMap: Record<
      string,
      { id: string; name: string; inputJson: string }
    > = {}
    const reader = stream.getReader()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value.type === 'text-delta') {
          onChunk({ content: value.delta })
        } else if (value.type === 'reasoning-delta') {
          onChunk({ reasoningContent: value.delta })
        } else if (value.type === 'tool-input-start') {
          toolCallsMap[value.id] = {
            id: value.id,
            name: value.toolName,
            inputJson: '',
          }
        } else if (value.type === 'tool-input-delta') {
          if (toolCallsMap[value.id])
            toolCallsMap[value.id].inputJson += value.delta
        } else if (value.type === 'finish') {
          onChunk({ done: true, toolCalls: buildToolCalls(toolCallsMap) })
          return
        } else if (value.type === 'error') {
          throw value.error
        }
      }
    } finally {
      reader.releaseLock()
    }

    onChunk({ done: true, toolCalls: buildToolCalls(toolCallsMap) })
  }
}
