import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { tw } from '../../theme'
import MessageItem, { type MessageItemProps } from './MessageItem'
import type { ChatMessage } from './types'

export interface MessageListProps
  extends Omit<MessageItemProps, 'msg' | 'onRetry' | 'children' | 'footer'> {
  messages: ChatMessage[]
  sessionId?: string
  emptyHint?: string
  onRetryLast?: () => void
  /** Custom message renderer. When omitted, the default MessageItem is used. */
  children?: (msg: ChatMessage, index: number) => React.ReactNode
}

export default function MessageList({
  messages,
  sessionId,
  emptyHint = 'Start a conversation',
  onRetryLast,
  children,
  ...itemProps
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const prevSessionId = useRef<string | undefined>(undefined)
  const isGenerating = messages[messages.length - 1]?.generating ?? false

  useEffect(() => {
    const isNewSession = prevSessionId.current !== sessionId
    prevSessionId.current = sessionId
    // setTimeout gives the browser enough time to finish layout after
    // React commits a potentially large message list to the DOM.
    // rAF-based approaches are unreliable because flex/overflow
    // calculations may still be pending after one or two frames.
    const id = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: isNewSession ? 'instant' : 'smooth',
      })
    }, 50)

    return () => clearTimeout(id)
  }, [sessionId, messages.length])

  // Observe inner content height changes (driven by typewriter character reveals)
  // and keep the bottom anchor in view throughout generation
  useEffect(() => {
    if (!isGenerating) return
    const inner = innerRef.current
    if (!inner) return

    const observer = new ResizeObserver(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    })
    observer.observe(inner)

    return () => observer.disconnect()
  }, [isGenerating])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${tw.primary.bgFocused}`}
        >
          <Sparkles size={24} className={tw.primary.text} />
        </div>
        <p className={`text-sm ${tw.text.tertiary}`}>{emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div ref={innerRef}>
        {messages.map((msg, index) => {
          if (children) {
            return children(msg, index)
          }

          return (
            <MessageItem
              key={msg.id}
              msg={msg}
              onRetry={onRetryLast}
              {...itemProps}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
