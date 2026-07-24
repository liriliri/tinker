import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, FolderOpen } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function SendPanel() {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!store.canSend) return
    store.sendMessage()
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePickFile = () => {
    if (!store.canSendBinary) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !store.canSendBinary) return
    const buffer = await file.arrayBuffer()
    store.sendBinary(buffer, file.name)
  }

  return (
    <div
      className={`h-full flex flex-col border-t ${tw.border} ${tw.bg.input}`}
    >
      <textarea
        ref={textareaRef}
        value={store.composeText}
        onChange={(e) => store.setComposeText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('composePlaceholder')}
        spellCheck={false}
        className={`flex-1 min-h-0 w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm font-mono outline-none ${tw.text.primary}`}
      />

      <div className="flex items-center gap-2 px-2 py-1.5 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handlePickFile}
          title={t('sendFile')}
          disabled={!store.canSendBinary}
          className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed ${tw.text.secondary} ${tw.hover}`}
        >
          <FolderOpen size={14} />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSend}
          title={t('send')}
          disabled={!store.canSend}
          className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed ${tw.primary.bg} ${tw.primary.bgHover}`}
        >
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
})
