import type { ChatMessage } from './types'

export interface ChatController {
  session: { id: string }
  messages: ChatMessage[]
  input: string
  systemPrompt: string
  isGenerating: boolean
  canSend: boolean
  providers: tinker.AiProviderInfo[]
  selectedCombined: string
  combinedOptions: Array<{ value: string; label: string }>
  setInput: (val: string) => void
  setSystemPrompt: (val: string) => void
  sendMessage: () => Promise<void>
  abortGeneration: () => void
  clearMessages: () => void
  setSelectedCombined: (val: string) => void
  retryLastMessage: () => Promise<void>
  deleteMessage: (id: string) => void
  systemPromptEditable?: boolean
}
