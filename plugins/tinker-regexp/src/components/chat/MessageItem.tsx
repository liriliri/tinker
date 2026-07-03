import { observer } from 'mobx-react-lite'
import {
  MessageItem as BaseMessageItem,
  ToolCard,
  type MessageItemProps as BaseProps,
  type ChatMessage as BaseChatMessage,
} from 'share/components/AiChat'
import store from '../../store'
import { getToolArgSummary, getVisibleToolMessages } from '../../lib/chatTools'
import type { ChatMessage } from '../../types/chat'

interface Props {
  msg: ChatMessage
  toolMessages?: ChatMessage[]
}

export default observer(function MessageItem({
  msg,
  toolMessages = [],
}: Props) {
  const { chat } = store
  const visibleToolMessages = getVisibleToolMessages(toolMessages)

  const footer =
    msg.role === 'assistant' && visibleToolMessages.length > 0 ? (
      <>
        {visibleToolMessages.map((toolMsg) => (
          <ToolCard
            key={toolMsg.id}
            msg={toolMsg}
            getArgSummary={getToolArgSummary}
          />
        ))}
      </>
    ) : undefined

  const itemProps: BaseProps = {
    msg: msg as BaseChatMessage,
    footer,
    isDark: store.isDark,
    onRetry: () => chat.retryLastMessage(),
    onDelete: (id) => chat.deleteMessage(id),
  }

  return <BaseMessageItem {...itemProps} />
})
