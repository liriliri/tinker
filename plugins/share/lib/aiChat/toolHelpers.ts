import { isToolMessageRenderable } from '../../components/AiChat'
import type { ChatMessage } from './types'

export function createToolMessageHelpers(supportedToolNames: Iterable<string>) {
  const names = new Set(supportedToolNames)

  function isSupportedToolName(name: string | undefined): boolean {
    return !!name && names.has(name)
  }

  function getVisibleToolMessages(toolMessages: ChatMessage[]): ChatMessage[] {
    return toolMessages.filter(
      (toolMsg) =>
        isSupportedToolName(toolMsg.toolName) &&
        isToolMessageRenderable(toolMsg)
    )
  }

  return {
    isSupportedToolName,
    getVisibleToolMessages,
  }
}
