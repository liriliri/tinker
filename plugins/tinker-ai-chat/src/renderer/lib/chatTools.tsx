import fileUrl from 'licia/fileUrl'
import type { AgentTool } from 'share/lib/Agent'
import {
  getImageCardProps,
  getSearchCardProps,
  isImageMessageRenderable,
  isSearchMessageRenderable,
  ImageCard,
  SearchCard,
  type ChatMessage,
} from 'share/components/AiChat'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import {
  GENERATE_IMAGE_TOOL,
  createGenerateImageToolResult,
} from 'share/tools/image'
import { WEB_SEARCH_TOOL, createWebSearchToolResult } from 'share/tools/web'

const WEB_SEARCH_AGENT_TOOL: AgentTool = {
  definition: WEB_SEARCH_TOOL,
  execute: async (args) => {
    const query = typeof args.query === 'string' ? args.query : ''
    const results = await aiChat.webSearch(query)
    return createWebSearchToolResult(results)
  },
}

const GENERATE_IMAGE_AGENT_TOOL: AgentTool = {
  definition: GENERATE_IMAGE_TOOL,
  execute: async (args) => {
    const prompt = typeof args.prompt === 'string' ? args.prompt : ''
    const size = typeof args.size === 'string' ? args.size : undefined
    const result = await tinker.generateImage({ prompt, size })
    return createGenerateImageToolResult(result)
  },
}

export const AI_CHAT_AGENT_TOOLS: AgentTool[] = [
  WEB_SEARCH_AGENT_TOOL,
  GENERATE_IMAGE_AGENT_TOOL,
]

const { getVisibleToolMessages } = createToolMessageHelpers([
  'web_search',
  'generate_image',
])

export function getAiChatVisibleToolMessages(
  toolMessages: ChatMessage[]
): ChatMessage[] {
  return getVisibleToolMessages(toolMessages).filter((msg) => {
    if (msg.toolName === 'web_search') return isSearchMessageRenderable(msg)
    if (msg.toolName === 'generate_image') return isImageMessageRenderable(msg)
    return true
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  if (name === 'web_search') {
    return typeof args.query === 'string' ? args.query : ''
  }
  if (name === 'generate_image') {
    return typeof args.prompt === 'string' ? args.prompt : ''
  }
  return ''
}

export function renderToolMessage(msg: ChatMessage) {
  if (msg.toolName === 'web_search') {
    return (
      <SearchCard
        {...getSearchCardProps(msg)}
        onOpenResult={(url) => tinker.openExternal(url)}
      />
    )
  }

  if (msg.toolName === 'generate_image') {
    return (
      <ImageCard
        {...getImageCardProps(msg)}
        onOpenImage={(path) => tinker.openExternal(fileUrl(path))}
      />
    )
  }

  return null
}
