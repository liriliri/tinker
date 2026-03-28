import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { MessageList as BaseMessageList } from 'share/components/AiChat'
import type { ChatMessage as BaseChatMessage } from 'share/components/AiChat'
import store from '../store'
import type { ChatMessage } from '../types'
import MessageItem from './MessageItem'

export default observer(function MessageList() {
  const { t } = useTranslation()
  const session = store.activeSession
  const messages = session?.messages ?? []

  // Access streaming content during render so MobX tracks it,
  // causing re-renders on every streaming chunk.
  const lastMsg = messages[messages.length - 1]
  void (lastMsg?.generating && lastMsg.content)

  // Filter out tool messages — they are rendered as footers inside MessageItem
  const visibleMessages = messages.filter(
    (msg) => msg.role !== 'tool'
  ) as BaseChatMessage[]

  // Build an index map for O(1) lookups from id → original position
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
      sessionId={session?.id}
      isDark={store.isDark}
      emptyHint={t('emptyHint')}
      retryLabel={t('retry')}
      deleteLabel={t('delete')}
      errorPrefix={t('errorPrefix')}
      onRetryLast={() => store.retryLastMessage()}
      onDelete={(id) => store.deleteMessage(id)}
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
