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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length])

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
      {session.messages.map((msg) => (
        <MessageItem key={msg.id} msg={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
})
