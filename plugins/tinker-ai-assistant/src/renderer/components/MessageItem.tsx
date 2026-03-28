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
import type { ChatMessage } from '../types'
import { isSupportedToolName } from '../lib/tools'
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
  const { t } = useTranslation()

  function openSearchResult(url: string) {
    aiAssistant.openExternal(url)
  }

  if (msg.role === 'tool') {
    if (shouldHideToolMessage(msg)) {
      return null
    }

    if (msg.toolName === 'web_search') {
      const searchCardProps = getSearchCardProps(msg)

      return (
        <div className="px-4 py-1">
          <SearchCard {...searchCardProps} onOpenResult={openSearchResult} />
        </div>
      )
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
          .map((toolMsg) => {
            if (toolMsg.toolName === 'web_search') {
              const searchCardProps = getSearchCardProps(toolMsg)

              return (
                <SearchCard
                  key={toolMsg.id}
                  {...searchCardProps}
                  onOpenResult={openSearchResult}
                />
              )
            }

            return <ToolCard key={toolMsg.id} msg={toolMsg} />
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
