import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { tw } from '../../theme'
import CopyButton from '../CopyButton'
import MarkdownContent from './MarkdownContent'
import type { ChatMessage } from './types'

/** Typewriter hook: reveals content character-by-character with adaptive speed.
 *  `streaming` should be true while the server is actively sending chunks.
 *  Once started, the animation continues until fully caught up even after streaming ends. */
function useTypewriter(content: string, streaming: boolean): string {
  const everStarted = useRef(false)
  const [displayedLen, setDisplayedLen] = useState(0)

  // Start typewriter on first chunk during streaming
  if (streaming && content.length > 0 && !everStarted.current) {
    everStarted.current = true
  }

  const shouldAnimate = everStarted.current

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedLen(content.length)
      return
    }

    if (displayedLen >= content.length) return

    const lag = content.length - displayedLen
    const charsToAdd = lag > 50 ? 8 : lag > 20 ? 4 : 1
    const delay = lag > 50 ? 10 : lag > 20 ? 20 : 35

    const timer = setTimeout(() => {
      setDisplayedLen((prev) => Math.min(prev + charsToAdd, content.length))
    }, delay)

    return () => clearTimeout(timer)
  }, [content, shouldAnimate, displayedLen])

  return content.slice(0, displayedLen)
}

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

  const displayedContent = useTypewriter(
    msg.content,
    !isUser && Boolean(msg.generating)
  )
  const showCursor =
    !isUser &&
    (Boolean(msg.generating) || displayedContent.length < msg.content.length) &&
    Boolean(displayedContent)

  const defaultContent = isUser ? (
    msg.content
  ) : (
    <MarkdownContent isDark={isDark}>{displayedContent}</MarkdownContent>
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
              {showCursor && (
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
