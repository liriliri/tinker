import type LocalStore from 'licia/LocalStore'
import { STORAGE_CHAT_OPEN } from './storage'

export async function initAiChatAvailability(storage: LocalStore): Promise<{
  hasAI: boolean
  chatOpen: boolean
}> {
  const providers = await tinker.getAIProviders()
  if (providers.length === 0) {
    return { hasAI: false, chatOpen: false }
  }

  const savedChatOpen = storage.get(STORAGE_CHAT_OPEN)
  return {
    hasAI: true,
    chatOpen: savedChatOpen === true,
  }
}

export function toggleAiChatOpen(
  storage: LocalStore,
  chatOpen: boolean
): boolean {
  const next = !chatOpen
  storage.set(STORAGE_CHAT_OPEN, next)
  return next
}
