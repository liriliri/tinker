import type { AgentTool } from 'share/lib/Agent'
import { ChatSession } from 'share/lib/aiChat/chatSession'
import { MemoryChatStorage } from 'share/lib/aiChat/chatStorage'
import type { ChatPrefsStorage } from 'share/lib/aiChat/chatPrefsStorage'
import AiChatStore from 'share/store/AiChat'

export function createTerminalChat(
  tabId: string,
  prefsStorage: ChatPrefsStorage,
  tools: AgentTool[]
): AiChatStore {
  const sessionStorage = new MemoryChatStorage(`terminal-${tabId}`)
  const chatSession = new ChatSession({
    sessionId: sessionStorage.sessionId,
    tools,
  })

  return new AiChatStore({
    chatSession,
    sessionStorage,
    prefsStorage,
    initialSystemPrompt:
      'You are a command line assistant. Help the user with shell commands, scripting, and terminal workflows. You have tools to read terminal context, get selected text, and interact with the active terminal pane. Tool schemas include an optional tab_id; this chat is bound to one tab and tab_id is always forced to that tab. Use tools when you need current terminal state or must run commands. Explain commands clearly and warn before suggesting destructive operations.',
  })
}
