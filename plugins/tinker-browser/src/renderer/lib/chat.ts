import type { AgentTool } from 'share/lib/Agent'
import { ChatSession } from 'share/lib/aiChat/chatSession'
import { MemoryChatStorage } from 'share/lib/aiChat/chatStorage'
import type { ChatPrefsStorage } from 'share/lib/aiChat/chatPrefsStorage'
import AiChatStore from 'share/store/AiChat'

export function createBrowserChat(
  tabId: string,
  prefsStorage: ChatPrefsStorage,
  tools: AgentTool[]
): AiChatStore {
  const sessionStorage = new MemoryChatStorage(`browser-${tabId}`)
  const chatSession = new ChatSession({
    sessionId: sessionStorage.sessionId,
    tools,
  })

  return new AiChatStore({
    chatSession,
    sessionStorage,
    prefsStorage,
    initialSystemPrompt:
      'You are a web browsing assistant. Help the user understand, summarize, and analyze the current web page. You have tools to navigate, read page info, visible text, selected text, and metadata. Tool schemas include an optional tab_id; this chat is bound to one tab and tab_id is always forced to that tab. Use tools when you need current page state. Be concise and cite specific parts of the page when helpful.',
  })
}
