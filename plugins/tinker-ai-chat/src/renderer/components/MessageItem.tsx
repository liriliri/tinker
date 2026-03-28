import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  MessageItem as BaseMessageItem,
  type MessageItemProps as BaseProps,
  type ChatMessage as BaseChatMessage,
  SearchCard,
  getSearchCardProps,
} from 'share/components/AiChat'
import store from '../store'
import { isSupportedToolName } from '../store'
import type { ChatMessage } from '../types'

interface Props {
  msg: ChatMessage
  toolMessages?: ChatMessage[]
}

function isVisibleToolMessage(msg: ChatMessage): boolean {
  return (
    msg.role === 'tool' &&
    isSupportedToolName(msg.toolName) &&
    msg.toolName === 'web_search'
  )
}

export default observer(function MessageItem({
  msg,
  toolMessages = [],
}: Props) {
  const { t } = useTranslation()

  function openSearchResult(url: string) {
    aiChat.openExternal(url)
  }

  if (msg.role === 'tool') {
    if (!isVisibleToolMessage(msg)) {
      return null
    }

    const searchCardProps = getSearchCardProps(msg)

    return (
      <div className="px-4 py-1">
        <SearchCard {...searchCardProps} onOpenResult={openSearchResult} />
      </div>
    )
  }

  const footer =
    msg.role === 'assistant' && toolMessages.length > 0 ? (
      <>
        {toolMessages.filter(isVisibleToolMessage).map((toolMsg) => {
          const searchCardProps = getSearchCardProps(toolMsg)

          return (
            <SearchCard
              key={toolMsg.id}
              {...searchCardProps}
              onOpenResult={openSearchResult}
            />
          )
        })}
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
