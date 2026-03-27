import { RefreshCw, Trash2 } from 'lucide-react'
import { tw } from '../../theme'
import CopyButton from '../CopyButton'
import MarkdownContent from './MarkdownContent'
import type { ChatMessage } from './types'

export interface MessageItemProps {
  msg: ChatMessage
  /** Custom content renderer. Replaces the default text/markdown display.
   *  MessageItem still handles outer layout, action buttons, and generating state. */
  children?: React.ReactNode
  /** Extra content rendered below the message bubble (e.g. search cards). */
  footer?: React.ReactNode
  isDark?: boolean
  // Labels
  retryLabel?: string
  deleteLabel?: string
  errorPrefix?: string
  // Callbacks
  onRetry?: () => void
  onDelete?: (id: string) => void
}

export default function MessageItem({
  msg,
  children,
  footer,
  isDark = false,
  retryLabel = 'Retry',
  deleteLabel = 'Delete',
  errorPrefix = 'Error: ',
  onRetry,
  onDelete,
}: MessageItemProps) {
  const isUser = msg.role === 'user'
  const hasTextContent = Boolean(msg.content || msg.error || msg.generating)

  const defaultContent = isUser ? (
    msg.content
  ) : (
    <MarkdownContent isDark={isDark}>{msg.content}</MarkdownContent>
  )

  return (
    <div
      className={`group flex gap-2 px-4 py-2 ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      <div
        className={`min-w-0 w-full ${isUser ? 'flex flex-col items-end' : ''}`}
      >
        {hasTextContent &&
          (msg.error ? (
            <div className="text-red-500 dark:text-red-400 text-sm whitespace-pre-wrap break-words">
              {errorPrefix}
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
              ) : (
                children ?? defaultContent
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
            {onRetry && (
              <button
                onClick={onRetry}
                title={retryLabel}
                className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
              >
                <RefreshCw size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(msg.id)}
                title={deleteLabel}
                className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}

        {footer && <div className="mt-3 flex flex-col gap-2">{footer}</div>}
      </div>
    </div>
  )
}
