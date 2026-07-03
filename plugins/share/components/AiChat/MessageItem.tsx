import { Children, isValidElement, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Trash2 } from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import { tw } from '../../theme'
import CopyButton from '../CopyButton'
import MarkdownContent from './MarkdownContent'
import type { ChatMessage } from './types'
import { AI_CHAT_NS } from './i18n'

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

function hasRenderableContent(node: React.ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (child == null || child === false) return false
    if (typeof child === 'string') return !isStrBlank(child)
    if (typeof child === 'number') return true
    return isValidElement(child)
  })
}

export interface MessageItemProps {
  msg: ChatMessage
  /** Custom content renderer. Replaces the default text/markdown display.
   *  MessageItem still handles outer layout, action buttons, and generating state. */
  children?: React.ReactNode
  /** Extra content rendered below the message bubble (e.g. search cards). */
  footer?: React.ReactNode
  isDark?: boolean
  onRetry?: () => void
  onDelete?: (id: string) => void
}

export default function MessageItem({
  msg,
  children,
  footer,
  isDark = false,
  onRetry,
  onDelete,
}: MessageItemProps) {
  const { t } = useTranslation(AI_CHAT_NS)
  const retry = t('retry')
  const del = t('delete')
  const errPrefix = t('errorPrefix')
  const isUser = msg.role === 'user'
  const hasVisibleContent = !isStrBlank(msg.content)
  const hasTextContent = Boolean(
    hasVisibleContent || msg.error || msg.generating
  )

  const displayedContent = useTypewriter(
    msg.content,
    !isUser && Boolean(msg.generating)
  )
  const showCursor =
    !isUser &&
    (Boolean(msg.generating) || displayedContent.length < msg.content.length) &&
    hasVisibleContent

  const defaultContent = isUser ? (
    msg.content
  ) : (
    <MarkdownContent isDark={isDark}>{displayedContent}</MarkdownContent>
  )

  const hasFooterContent = hasRenderableContent(footer)

  if (!hasTextContent && !hasFooterContent && !children) {
    return null
  }

  if (!hasTextContent && hasFooterContent && !children) {
    return (
      <div className="px-4 py-1">
        <div className="flex flex-col gap-1">{footer}</div>
      </div>
    )
  }

  return (
    <div
      className={`group flex gap-2 px-4 py-1.5 ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      <div
        className={`min-w-0 w-full ${isUser ? 'flex flex-col items-end' : ''}`}
      >
        {hasTextContent &&
          (msg.error ? (
            <div className="text-red-500 dark:text-red-400 text-sm whitespace-pre-wrap break-words">
              {errPrefix}
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
              {msg.generating && !hasVisibleContent ? (
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
          <div className="flex h-6 items-center gap-0.5 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto">
            <CopyButton
              text={msg.content}
              variant="toolbar"
              size={13}
              className={tw.text.tertiary}
            />
            {onRetry && (
              <button
                onClick={onRetry}
                title={retry}
                className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
              >
                <RefreshCw size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(msg.id)}
                title={del}
                className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}

        {hasFooterContent && (
          <div className="flex flex-col gap-1">{footer}</div>
        )}
      </div>
    </div>
  )
}
