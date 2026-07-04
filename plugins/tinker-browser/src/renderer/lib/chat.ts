import { ChatSession } from 'share/lib/aiChat/chatSession'
import { MemoryChatStorage } from 'share/lib/aiChat/chatStorage'
import type { ChatPrefsStorage } from 'share/lib/aiChat/chatPrefsStorage'
import AiChatStore from 'share/store/AiChat'
import { createBrowserAgentTools } from './chatTools'

export function createBrowserChat(
  tabId: string,
  prefsStorage: ChatPrefsStorage
): AiChatStore {
  const sessionStorage = new MemoryChatStorage(`browser-${tabId}`)
  const chatSession = new ChatSession({
    sessionId: sessionStorage.sessionId,
    tools: createBrowserAgentTools(tabId),
  })

  return new AiChatStore({
    chatSession,
    sessionStorage,
    prefsStorage,
    initialSystemPrompt:
      'You are a web browsing assistant. Help the user understand, summarize, and analyze the current web page. You have tools to read page info, visible text, selected text, and metadata. Use tools when you need current page state. Be concise and cite specific parts of the page when helpful.',
  })
}
