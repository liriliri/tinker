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
  const prevSessionId = useRef<string | undefined>(undefined)

  // Track streaming content for scroll tracking (caller should pass reactive messages)
  const lastMsg = messages[messages.length - 1]
  const streamingContent = lastMsg?.generating ? lastMsg.content : null

  useEffect(() => {
    const isNewSession = prevSessionId.current !== sessionId
    prevSessionId.current = sessionId
    bottomRef.current?.scrollIntoView({
      behavior: isNewSession ? 'instant' : 'smooth',
    })
  }, [sessionId, messages.length])

  useEffect(() => {
    if (streamingContent !== null) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [streamingContent])

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
  )
}
