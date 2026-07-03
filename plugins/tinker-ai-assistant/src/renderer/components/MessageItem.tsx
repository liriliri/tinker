import { observer } from 'mobx-react-lite'
import {
  MessageItem as BaseMessageItem,
  ToolCard,
  isToolMessageRenderable,
  type MessageItemProps as BaseProps,
  type ChatMessage as BaseChatMessage,
  SearchCard,
  getSearchCardProps,
  isSearchMessageRenderable,
} from 'share/components/AiChat'
import store from '../store'
import type { ChatMessage } from '../types'
import {
  getToolArgSummary,
  getToolLabel,
  isSupportedToolName,
} from '../lib/tools'

interface Props {
  msg: ChatMessage
  toolMessages?: ChatMessage[]
}

function shouldHideToolMessage(msg: ChatMessage): boolean {
  return msg.role === 'tool' && !isSupportedToolName(msg.toolName)
}

function getVisibleToolMessages(toolMessages: ChatMessage[]): ChatMessage[] {
  return toolMessages.filter((toolMsg) => {
    if (shouldHideToolMessage(toolMsg)) return false
    if (toolMsg.toolName === 'web_search') {
      return isSearchMessageRenderable(toolMsg)
    }
    return isToolMessageRenderable(toolMsg)
  })
}

export default observer(function MessageItem({
  msg,
  toolMessages = [],
}: Props) {
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
        <ToolCard
          msg={msg}
          getToolLabel={getToolLabel}
          getArgSummary={getToolArgSummary}
        />
      </div>
    )
  }

  const visibleToolMessages = getVisibleToolMessages(toolMessages)

  const footer =
    msg.role === 'assistant' && visibleToolMessages.length > 0 ? (
      <>
        {visibleToolMessages.map((toolMsg) => {
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

          return (
            <ToolCard
              key={toolMsg.id}
              msg={toolMsg}
              getToolLabel={getToolLabel}
              getArgSummary={getToolArgSummary}
            />
          )
        })}
      </>
    ) : undefined

  const itemProps: BaseProps = {
    msg: msg as BaseChatMessage,
    footer,
    isDark: store.isDark,
    onRetry: () => store.retryLastMessage(),
    onDelete: (id) => store.deleteMessage(id),
  }

  return <BaseMessageItem {...itemProps} />
})
