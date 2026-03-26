import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import MessageItem from './MessageItem'

export default observer(function MessageList() {
  const { t } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)
  const session = store.activeSession

  const prevSessionId = useRef<string | undefined>(undefined)

  // Access generating message content during render so MobX tracks it,
  // causing re-renders (and scroll) on every streaming chunk.
  const lastMsg = session?.messages[session.messages.length - 1]
  const streamingContent = lastMsg?.generating ? lastMsg.content : null

  useEffect(() => {
    const isNewSession = prevSessionId.current !== session?.id
    prevSessionId.current = session?.id
    bottomRef.current?.scrollIntoView({
      behavior: isNewSession ? 'instant' : 'smooth',
    })
  }, [session?.id, session?.messages.length])

  useEffect(() => {
    if (streamingContent !== null) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [streamingContent])

  if (!session || session.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900`}
        >
          <Sparkles size={24} className="text-emerald-500" />
        </div>
        <p className={`text-sm ${tw.text.tertiary}`}>{t('emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {session.messages.map((msg, index) => {
        if (msg.role === 'tool') return null

        let toolMessages: typeof session.messages = []
        if (msg.role === 'assistant') {
          toolMessages = []
          for (let i = index + 1; i < session.messages.length; i++) {
            const nextMsg = session.messages[i]
            if (nextMsg.role !== 'tool') break
            toolMessages.push(nextMsg)
          }
        }

        return (
          <MessageItem key={msg.id} msg={msg} toolMessages={toolMessages} />
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
})
