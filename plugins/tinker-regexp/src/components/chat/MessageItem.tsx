import { observer } from 'mobx-react-lite'
import {
  MessageItem as BaseMessageItem,
  type MessageItemProps as BaseProps,
  type ChatMessage as BaseChatMessage,
} from 'share/components/AiChat'
import chatStore from '../../chatStore'
import { isSupportedToolName } from '../../lib/chatTools'
import type { ChatMessage } from '../../types/chat'
import ToolCard from './ToolCard'

interface Props {
  msg: ChatMessage
  toolMessages?: ChatMessage[]
}

function shouldHideToolMessage(msg: ChatMessage): boolean {
  return msg.role === 'tool' && !isSupportedToolName(msg.toolName)
}

export default observer(function MessageItem({
  msg,
  toolMessages = [],
}: Props) {
  if (msg.role === 'tool') {
    if (shouldHideToolMessage(msg)) {
      return null
    }

    return (
      <div className="px-4 py-1">
        <ToolCard msg={msg} />
      </div>
    )
  }

  const footer =
    msg.role === 'assistant' && toolMessages.length > 0 ? (
      <>
        {toolMessages
          .filter((toolMsg) => !shouldHideToolMessage(toolMsg))
          .map((toolMsg) => (
            <ToolCard key={toolMsg.id} msg={toolMsg} />
          ))}
      </>
    ) : undefined

  const itemProps: BaseProps = {
    msg: msg as BaseChatMessage,
    footer,
    isDark: chatStore.isDark,
    onRetry: () => chatStore.retryLastMessage(),
    onDelete: (id) => chatStore.deleteMessage(id),
  }

  return <BaseMessageItem {...itemProps} />
})
