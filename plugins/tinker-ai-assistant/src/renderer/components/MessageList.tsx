import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  MessageItem as BaseMessageItem,
  MessageList as BaseMessageList,
  type ChatMessage,
  type MessageItemProps as BaseMessageItemProps,
} from 'share/components/AiChat'
import {
  getAssistantVisibleToolMessages,
  renderAssistantToolMessage,
} from '../lib/assistantTools'
import store from '../store'

export default observer(function MessageList() {
  const { t } = useTranslation()
  const messages = store.messages
  const lastMsg = messages[messages.length - 1]
  if (lastMsg?.generating) {
    void lastMsg.content
  }

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

  function renderMessageItem(msg: ChatMessage, toolMessages: ChatMessage[]) {
    const visibleToolMessages = getAssistantVisibleToolMessages(toolMessages)

    const footer =
      msg.role === 'assistant' && visibleToolMessages.length > 0 ? (
        <>
          {visibleToolMessages.map((toolMsg) => (
            <div key={toolMsg.id}>{renderAssistantToolMessage(toolMsg)}</div>
          ))}
        </>
      ) : undefined

    const itemProps: BaseMessageItemProps = {
      msg,
      footer,
      isDark: store.isDark,
      onRetry: () => store.retryLastMessage(),
      onDelete: (id) => store.deleteMessage(id),
    }

    return <BaseMessageItem {...itemProps} />
  }

  return (
    <BaseMessageList
      messages={visibleMessages}
      sessionId={store.sessionLoaded ? 'loaded' : undefined}
      isDark={store.isDark}
      emptyHint={t('emptyHint')}
    >
      {(baseMsg) => {
        const originalIndex = indexById.get(baseMsg.id) ?? -1
        const msg = messages[originalIndex]
        const toolMessages = getToolMessages(msg, originalIndex)

        return <div key={msg.id}>{renderMessageItem(msg, toolMessages)}</div>
      }}
    </BaseMessageList>
  )
})
