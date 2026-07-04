import type LocalStore from 'licia/LocalStore'
import aiChatProviders from './providers'
import { STORAGE_CHAT_OPEN } from './storage'

export async function initAiChatAvailability(storage: LocalStore): Promise<{
  hasAI: boolean
  chatOpen: boolean
}> {
  await aiChatProviders.ensureLoaded()
  if (aiChatProviders.providers.length === 0) {
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
