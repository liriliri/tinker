import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  MessageItem as BaseMessageItem,
  type MessageItemProps as BaseProps,
  type ChatMessage as BaseChatMessage,
} from 'share/components/AiChat'
import store from '../store'
import type { ChatMessage } from '../types'
import SearchCard from './SearchCard'

interface Props {
  msg: ChatMessage
  toolMessages?: ChatMessage[]
}

export default observer(function MessageItem({
  msg,
  toolMessages = [],
}: Props) {
  const { t } = useTranslation()

  if (msg.role === 'tool') {
    return (
      <div className="px-4 py-1">
        <SearchCard msg={msg} />
      </div>
    )
  }

  const footer =
    msg.role === 'assistant' && toolMessages.length > 0 ? (
      <>
        {toolMessages.map((toolMsg) => (
          <SearchCard key={toolMsg.id} msg={toolMsg} />
        ))}
      </>
    ) : undefined

  const itemProps: BaseProps = {
    msg: msg as BaseChatMessage,
    footer,
    isDark: store.isDark,
    retryLabel: t('retry'),
    deleteLabel: t('delete'),
    errorPrefix: t('errorPrefix'),
    onRetry: () => store.retryLastMessage(),
    onDelete: (id) => store.deleteMessage(id),
  }

  return <BaseMessageItem {...itemProps} />
})
