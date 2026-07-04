import { ChatSession } from 'share/lib/aiChat/chatSession'
import { MemoryChatStorage } from 'share/lib/aiChat/chatStorage'
import type { ChatPrefsStorage } from 'share/lib/aiChat/chatPrefsStorage'
import AiChatStore from 'share/store/AiChat'
import { createGitAgentTools } from './chatTools'

export function buildGitSystemPrompt(repoPath: string): string {
  const base =
    'You are a Git assistant. Help the user with Git workflows, history, branches, merges, rebases, and repository management. You have a shell tool to run commands in the repository directory — prefer `git` commands and explain what you run. Warn before suggesting destructive operations such as force push, hard reset, or discarding changes.'

  if (!repoPath) {
    return `${base}\n\nNo repository is open yet. Ask the user to open one before running git commands.`
  }

  return `${base}\n\nRepository path: ${repoPath}`
}

export function createGitChat(
  tabId: string,
  prefsStorage: ChatPrefsStorage,
  getRepoPath: () => string
): AiChatStore {
  const sessionStorage = new MemoryChatStorage(`git-${tabId}`)
  const chatSession = new ChatSession({
    sessionId: sessionStorage.sessionId,
    tools: createGitAgentTools(getRepoPath),
  })

  return new AiChatStore({
    chatSession,
    sessionStorage,
    prefsStorage,
    initialSystemPrompt: buildGitSystemPrompt(getRepoPath()),
  })
}
