import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Copy, RefreshCw, Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import store from '../store'
import type { ChatMessage } from '../types'

interface Props {
  msg: ChatMessage
}

function CopyBtn({ text }: { text: string }) {
  const { copied, copyToClipboard } = useCopyToClipboard()
  return (
    <button
      onClick={() => copyToClipboard(text)}
      className={`p-1 rounded ${tw.hover} ${
        copied ? tw.primary.text : tw.text.tertiary
      }`}
    >
      <Copy size={13} />
    </button>
  )
}

const MessageItem = observer(function MessageItem({ msg }: Props) {
  const { t } = useTranslation()
  const isUser = msg.role === 'user'

  return (
    <div
      className={`group flex gap-3 px-4 py-3 ${
        isUser ? '' : `${tw.bg.secondary}`
      }`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold
        ${isUser ? 'bg-blue-500' : 'bg-emerald-500'}`}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium mb-1 ${tw.text.tertiary}`}>
          {isUser ? t('you') : t('assistant')}
        </div>

        {msg.error ? (
          <div className="text-red-500 dark:text-red-400 text-sm whitespace-pre-wrap break-words">
            {t('errorPrefix')}
            {msg.error}
          </div>
        ) : (
          <div
            className={`text-sm whitespace-pre-wrap break-words ${tw.text.primary}`}
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
        {!msg.generating && (
          <div className="flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyBtn text={msg.content} />
            {!isUser && (
              <button
                onClick={() => store.retryLastMessage()}
                title={t('retry')}
                className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
              >
                <RefreshCw size={13} />
              </button>
            )}
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
