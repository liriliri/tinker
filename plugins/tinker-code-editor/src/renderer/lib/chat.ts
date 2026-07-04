import { ChatSession } from 'share/lib/aiChat/chatSession'
import { MemoryChatStorage } from 'share/lib/aiChat/chatStorage'
import type { ChatPrefsStorage } from 'share/lib/aiChat/chatPrefsStorage'
import AiChatStore from 'share/store/AiChat'
import { createCodeEditorAgentTools, type EditorChatContext } from './chatTools'

export function buildCodeEditorSystemPrompt(rootPath: string): string {
  const base =
    'You are a coding assistant in a code editor. Help the user read, write, and edit project files, explore the codebase, and run shell commands in the project directory. Prefer small, focused changes and explain what you run or modify. Use get_active_file and list_open_files to see which files are open in the editor, then read_file for content.'

  if (!rootPath) {
    return `${base}\n\nNo project folder is open yet. Ask the user to open one before using file or shell tools.`
  }

  return `${base}\n\nProject root: ${rootPath}`
}

export function createCodeEditorChat(
  prefsStorage: ChatPrefsStorage,
  getRootPath: () => string,
  getEditorContext: () => EditorChatContext
): AiChatStore {
  const sessionStorage = new MemoryChatStorage('code-editor')
  const chatSession = new ChatSession({
    sessionId: sessionStorage.sessionId,
    tools: createCodeEditorAgentTools(getRootPath, getEditorContext),
  })

  return new AiChatStore({
    chatSession,
    sessionStorage,
    prefsStorage,
    initialSystemPrompt: buildCodeEditorSystemPrompt(getRootPath()),
  })
}
