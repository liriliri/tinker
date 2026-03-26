import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search, RefreshCw, Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import CopyButton from 'share/components/CopyButton'
import store from '../store'
import type { ChatMessage } from '../types'
import MarkdownContent from './MarkdownContent'

interface Props {
  msg: ChatMessage
  toolMessages?: ChatMessage[]
}

interface SearchCardProps {
  msg: ChatMessage
}

const SearchCard = observer(function SearchCard({ msg }: SearchCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  if (msg.isSearching || (msg.generating && !msg.searchResults)) {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] ${tw.border} ${tw.bg.secondary} ${tw.text.secondary}`}
      >
        <Search size={11} className="animate-pulse shrink-0" />
        <span>
          {t('searching')}：
          <span className={tw.text.primary}>{msg.searchQuery}</span>
        </span>
      </div>
    )
  }

  if (msg.error) {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] text-red-500 dark:text-red-400 ${tw.border} ${tw.bg.secondary}`}
      >
        <Search size={11} className="shrink-0" />
        <span>
          {t('searchFailed')}：{msg.searchQuery}
        </span>
      </div>
    )
  }

  const count = msg.searchResults?.length ?? 0

  return (
    <div
      className={`overflow-hidden rounded-xl border text-[11px] ${tw.border} ${tw.bg.secondary}`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full px-2.5 py-2 text-left ${tw.hover}`}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tw.primary.bg} text-white`}
          >
            <Search size={10} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`min-w-0 flex-1 truncate text-[11px] font-medium leading-4 ${tw.text.primary}`}
              >
                {msg.searchQuery}
              </div>
              <span className={`shrink-0 leading-none ${tw.text.tertiary}`}>
                {count} {t('searchResults')}
              </span>
            </div>
          </div>
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform ${tw.text.tertiary} ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {expanded && msg.searchResults && msg.searchResults.length > 0 && (
        <div
          className={`flex flex-col gap-1.5 border-t px-2.5 py-2 ${tw.border}`}
        >
          {msg.searchResults.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => aiChat.openExternal(r.url)}
              className={`block w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors ${tw.border} ${tw.hover}`}
            >
              <div className="flex items-start gap-1.5">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none ${tw.bg.secondary} ${tw.text.tertiary}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`line-clamp-1 text-[11px] font-medium leading-4 ${tw.primary.text}`}
                  >
                    {r.title}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

const MessageItem = observer(function MessageItem({
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

  const isUser = msg.role === 'user'
  const hasTextContent = Boolean(msg.content || msg.error || msg.generating)
  const showAssistantShell =
    isUser || hasTextContent || toolMessages.length === 0

  return (
    <div
      className={`group flex gap-2 px-4 py-2 ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      <div
        className={`min-w-0 w-full ${isUser ? 'flex flex-col items-end' : ''}`}
      >
        {showAssistantShell &&
          (msg.error ? (
            <div className="text-red-500 dark:text-red-400 text-sm whitespace-pre-wrap break-words">
              {t('errorPrefix')}
              {msg.error}
            </div>
          ) : (
            <div
              className={`text-sm break-words ${tw.text.primary} ${
                isUser
                  ? `inline-block rounded-2xl ${tw.bg.secondary} px-3 py-2 whitespace-pre-wrap`
                  : ''
              }`}
            >
              {msg.generating && !msg.content ? (
                <span className="flex h-4 items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${tw.primary.bg}`}
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${tw.primary.bg}`}
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${tw.primary.bg}`}
                    style={{ animationDelay: '300ms' }}
                  />
                </span>
              ) : isUser ? (
                msg.content
              ) : (
                <MarkdownContent>{msg.content}</MarkdownContent>
              )}
              {msg.generating && msg.content && (
                <span
                  className={`inline-block w-2 h-4 ml-0.5 align-text-bottom animate-pulse ${tw.primary.bg}`}
                />
              )}
            </div>
          ))}

        {!msg.generating && !isUser && hasTextContent && (
          <div className="flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton
              text={msg.content}
              variant="toolbar"
              size={13}
              className={tw.text.tertiary}
            />
            <button
              onClick={() => store.retryLastMessage()}
              title={t('retry')}
              className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => store.deleteMessage(msg.id)}
              title={t('delete')}
              className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {!isUser && toolMessages.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {toolMessages.map((toolMsg) => (
              <SearchCard key={toolMsg.id} msg={toolMsg} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export default MessageItem
