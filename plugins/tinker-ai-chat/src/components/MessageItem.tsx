import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Trash2, User } from 'lucide-react'
import { tw } from 'share/theme'
import CopyButton from 'share/components/CopyButton'
import store from '../store'
import type { ChatMessage } from '../types'

interface Props {
  msg: ChatMessage
}

const MessageItem = observer(function MessageItem({ msg }: Props) {
  const { t } = useTranslation()
  const isUser = msg.role === 'user'

  return (
    <div
      className={`group flex gap-2 px-4 py-2 ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          isUser ? 'bg-blue-500' : 'bg-emerald-500'
        }`}
      >
        {isUser ? <User size={16} /> : 'AI'}
      </div>

      {/* Content */}
      <div
        className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}
      >
        {msg.error ? (
          <div className="text-red-500 dark:text-red-400 text-sm whitespace-pre-wrap break-words">
            {t('errorPrefix')}
            {msg.error}
          </div>
        ) : (
          <div
            className={`text-sm whitespace-pre-wrap break-words ${
              tw.text.primary
            } ${
              isUser
                ? `inline-block rounded-2xl ${tw.bg.secondary} px-3 py-2`
                : ''
            }`}
          >
            {msg.content}
            {msg.generating && (
              <span
                className={`inline-block w-2 h-4 ml-0.5 align-text-bottom animate-pulse ${tw.primary.bg}`}
              />
            )}
          </div>
        )}

        {/* Actions */}
        {!msg.generating && !isUser && (
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
      </div>
    </div>
  )
})

export default MessageItem
