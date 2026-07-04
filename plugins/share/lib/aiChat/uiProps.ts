import type { ChatController } from './chatController'

export function getPluginChatProps(chat: ChatController) {
  const messages = chat.messages
  const lastMsg = messages[messages.length - 1]
  if (lastMsg?.generating) {
    void lastMsg.content
  }

  return {
    messages,
    sessionId: chat.session.id,
    input: chat.input,
    isGenerating: chat.isGenerating,
    canSend: chat.canSend,
    hasProviders: chat.providers.length > 0,
    selectedCombined: chat.selectedCombined,
    combinedOptions: chat.combinedOptions,
    canClearMessages: chat.messages.length > 0,
    ...(chat.systemPromptEditable
      ? {
          systemPrompt: chat.systemPrompt,
          onSystemPromptChange: (value: string) => chat.setSystemPrompt(value),
        }
      : {}),
    onInputChange: (value: string) => chat.setInput(value),
    onSend: () => chat.sendMessage(),
    onStop: () => chat.abortGeneration(),
    onClearMessages: () => chat.clearMessages(),
    onModelChange: (value: string) => chat.setSelectedCombined(value),
    onRetryLastMessage: () => chat.retryLastMessage(),
    onDeleteMessage: (id: string) => chat.deleteMessage(id),
  }
}
