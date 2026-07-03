import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  MessageList as BaseMessageList,
  type ChatMessage as BaseChatMessage,
} from 'share/components/AiChat'
import store from '../../store'
import type { ChatMessage } from '../../types/chat'
import MessageItem from './MessageItem'

export default observer(function MessageList() {
  const { t } = useTranslation()
  const { chat } = store
  const messages = chat.messages

  const lastMsg = messages[messages.length - 1]
  if (lastMsg?.generating) {
    void lastMsg.content
  }

  const visibleMessages = messages.filter(
    (msg) => msg.role !== 'tool'
  ) as BaseChatMessage[]

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
    <BaseMessageList
      messages={visibleMessages}
      sessionId={chat.session.id}
      isDark={store.isDark}
      emptyHint={t('chatEmptyHint')}
    >
      {(baseMsg) => {
        const originalIndex = indexById.get(baseMsg.id) ?? -1
        const msg = messages[originalIndex]
        const toolMessages = getToolMessages(msg, originalIndex)

        return (
          <MessageItem key={msg.id} msg={msg} toolMessages={toolMessages} />
        )
      }}
    </BaseMessageList>
  )
})
