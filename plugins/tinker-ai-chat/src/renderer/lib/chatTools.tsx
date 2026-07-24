import type { AgentTool } from 'share/lib/Agent'
import {
  getSearchCardProps,
  isSearchMessageRenderable,
  SearchCard,
  type ChatMessage,
} from 'share/components/AiChat'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import { WEB_SEARCH_TOOL, createWebSearchToolResult } from 'share/tools/web'

const WEB_SEARCH_AGENT_TOOL: AgentTool = {
  definition: WEB_SEARCH_TOOL,
  execute: async (args) => {
    const query = typeof args.query === 'string' ? args.query : ''
    const results = await aiChat.webSearch(query)
    return createWebSearchToolResult(results)
  },
}

export const AI_CHAT_AGENT_TOOLS: AgentTool[] = [WEB_SEARCH_AGENT_TOOL]

const { getVisibleToolMessages } = createToolMessageHelpers(['web_search'])

export function getAiChatVisibleToolMessages(
  toolMessages: ChatMessage[]
): ChatMessage[] {
  return getVisibleToolMessages(toolMessages).filter(isSearchMessageRenderable)
}

export function getToolArgSummary(): string {
  return ''
}

export function renderSearchToolMessage(msg: ChatMessage) {
  return (
    <SearchCard
      {...getSearchCardProps(msg)}
      onOpenResult={(url) => tinker.openExternal(url)}
    />
  )
}
