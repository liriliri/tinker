import type { ReactNode } from 'react'
import { Toolbar, ToolbarSpacer } from '../Toolbar'
import { tw } from '../../theme'
import ChatClearButton from './ChatClearButton'
import ChatInputArea from './ChatInputArea'
import MessageItem from './MessageItem'
import MessageList from './MessageList'
import ToolCard, { isToolMessageRenderable } from './ToolCard'
import type { ChatMessage } from './types'
import type { MessageItemProps as BaseMessageItemProps } from './MessageItem'

function defaultGetVisibleToolMessages(
  toolMessages: ChatMessage[]
): ChatMessage[] {
  return toolMessages.filter(isToolMessageRenderable)
}

export interface PluginChatProps {
  isDark: boolean
  title: string
  inputPlaceholder: string
  emptyHint: string
  messages: ChatMessage[]
  sessionId: string
  input: string
  isGenerating: boolean
  canSend: boolean
  hasProviders: boolean
  selectedCombined: string
  combinedOptions: Array<{ value: string; label: string }>
  canClearMessages: boolean
  getToolArgSummary: (name: string, args: Record<string, unknown>) => string
  getVisibleToolMessages?: (toolMessages: ChatMessage[]) => ChatMessage[]
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  onClearMessages: () => void
  onModelChange: (value: string) => void
  onRetryLastMessage: () => void
  onDeleteMessage: (id: string) => void
  systemPrompt?: string
  onSystemPromptChange?: (value: string) => void
  renderToolMessage?: (msg: ChatMessage) => ReactNode
}

interface PluginChatMessageItemProps {
  isDark: boolean
  msg: ChatMessage
  toolMessages?: ChatMessage[]
  getToolArgSummary: (name: string, args: Record<string, unknown>) => string
  getVisibleToolMessages?: (toolMessages: ChatMessage[]) => ChatMessage[]
  onRetryLastMessage: () => void
  onDeleteMessage: (id: string) => void
  renderToolMessage?: (msg: ChatMessage) => ReactNode
}

function PluginChatMessageItem({
  isDark,
  msg,
  toolMessages = [],
  getToolArgSummary,
  getVisibleToolMessages = defaultGetVisibleToolMessages,
  onRetryLastMessage,
  onDeleteMessage,
  renderToolMessage,
}: PluginChatMessageItemProps) {
  const visibleToolMessages = getVisibleToolMessages(toolMessages)

  const footer =
    msg.role === 'assistant' && visibleToolMessages.length > 0 ? (
      <>
        {visibleToolMessages.map((toolMsg) =>
          renderToolMessage ? (
            <div key={toolMsg.id}>{renderToolMessage(toolMsg)}</div>
          ) : (
            <ToolCard
              key={toolMsg.id}
              msg={toolMsg}
              getArgSummary={getToolArgSummary}
            />
          )
        )}
      </>
    ) : undefined

  const itemProps: BaseMessageItemProps = {
    msg,
    footer,
    isDark,
    onRetry: onRetryLastMessage,
    onDelete: onDeleteMessage,
  }

  return <MessageItem {...itemProps} />
}

interface PluginChatMessageListProps {
  messages: ChatMessage[]
  sessionId: string
  isDark: boolean
  emptyHint: string
  getToolArgSummary: (name: string, args: Record<string, unknown>) => string
  getVisibleToolMessages?: (toolMessages: ChatMessage[]) => ChatMessage[]
  onRetryLastMessage: () => void
  onDeleteMessage: (id: string) => void
  renderToolMessage?: (msg: ChatMessage) => ReactNode
}

function PluginChatMessageList({
  messages,
  sessionId,
  isDark,
  emptyHint,
  getToolArgSummary,
  getVisibleToolMessages = defaultGetVisibleToolMessages,
  onRetryLastMessage,
  onDeleteMessage,
  renderToolMessage,
}: PluginChatMessageListProps) {
  const visibleMessages = messages.filter((msg) => msg.role !== 'tool')

  const indexById = new Map(messages.map((m, i) => [m.id, i]))

  function getToolMessages(msg: ChatMessage, index: number): ChatMessage[] {
    if (msg.role !== 'assistant') return []
    const toolMessages: ChatMessage[] = []
    for (let i = index + 1; i < messages.length; i++) {
      const next = messages[i]
      if (next.role !== 'tool') break
      toolMessages.push(next)
    }
    return toolMessages
  }

  return (
    <MessageList
      messages={visibleMessages}
      sessionId={sessionId}
      isDark={isDark}
      emptyHint={emptyHint}
    >
      {(baseMsg) => {
        const originalIndex = indexById.get(baseMsg.id) ?? -1
        const msg = messages[originalIndex]
        const toolMessages = getToolMessages(msg, originalIndex)

        return (
          <PluginChatMessageItem
            key={msg.id}
            isDark={isDark}
            msg={msg}
            toolMessages={toolMessages}
            getToolArgSummary={getToolArgSummary}
            getVisibleToolMessages={getVisibleToolMessages}
            onRetryLastMessage={onRetryLastMessage}
            onDeleteMessage={onDeleteMessage}
            renderToolMessage={renderToolMessage}
          />
        )
      }}
    </MessageList>
  )
}

export default function PluginChat({
  isDark,
  title,
  inputPlaceholder,
  emptyHint,
  messages,
  sessionId,
  input,
  isGenerating,
  canSend,
  hasProviders,
  selectedCombined,
  combinedOptions,
  canClearMessages,
  getToolArgSummary,
  getVisibleToolMessages,
  onInputChange,
  onSend,
  onStop,
  onClearMessages,
  onModelChange,
  onRetryLastMessage,
  onDeleteMessage,
  systemPrompt,
  onSystemPromptChange,
  renderToolMessage,
}: PluginChatProps) {
  return (
    <div className={`h-full flex flex-col overflow-hidden ${tw.bg.primary}`}>
      <Toolbar className={`border-b ${tw.border}`}>
        <span className={`text-sm font-medium ${tw.text.primary}`}>
          {title}
        </span>
        <ToolbarSpacer />
        <ChatClearButton
          onClick={onClearMessages}
          disabled={!canClearMessages}
        />
      </Toolbar>
      <PluginChatMessageList
        messages={messages}
        sessionId={sessionId}
        isDark={isDark}
        emptyHint={emptyHint}
        getToolArgSummary={getToolArgSummary}
        getVisibleToolMessages={getVisibleToolMessages}
        onRetryLastMessage={onRetryLastMessage}
        onDeleteMessage={onDeleteMessage}
        renderToolMessage={renderToolMessage}
      />
      <ChatInputArea
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
        canSend={canSend}
        placeholder={inputPlaceholder}
        hasProviders={hasProviders}
        selectedCombined={selectedCombined}
        combinedOptions={combinedOptions}
        onModelChange={onModelChange}
        systemPrompt={systemPrompt}
        onSystemPromptChange={onSystemPromptChange}
      />
    </div>
  )
}
