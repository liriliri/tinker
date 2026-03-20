import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Square } from 'lucide-react'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function InputArea() {
  const { t } = useTranslation()

  const providerOptions = store.providers.map((p) => ({
    value: p.name,
    label: p.name,
  }))

  const modelOptions = store.currentModels.map((m) => ({
    value: m.name,
    label: m.name,
  }))

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      store.sendMessage()
    }
  }

  return (
    <div className={`border-t ${tw.border} px-3 py-2 flex flex-col gap-2`}>
      {/* Provider / Model selectors */}
      {store.providers.length > 0 && (
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <Select
              value={store.selectedProvider}
              onChange={(val) => store.setSelectedProvider(val as string)}
              options={providerOptions}
            />
          </div>
          <div className="flex-1 min-w-0">
            <Select
              value={store.selectedModel}
              onChange={(val) => store.setSelectedModel(val as string)}
              options={modelOptions}
            />
          </div>
        </div>
      )}

      {/* No providers configured */}
      {store.providers.length === 0 && (
        <p className={`text-xs ${tw.text.tertiary}`}>{t('noProviders')}</p>
      )}

      {/* Textarea + Send */}
      <div className="flex gap-2 items-end">
        <textarea
          value={store.input}
          onChange={(e) => store.setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          rows={3}
          className={`flex-1 resize-none rounded border px-3 py-2 text-sm outline-none focus:ring-1 ${tw.bg.input} ${tw.border} ${tw.text.primary} focus:ring-blue-500`}
          disabled={store.isGenerating}
        />
        {store.isGenerating ? (
          <button
            onClick={() => store.abortGeneration()}
            title={t('stop')}
            className={`shrink-0 w-8 h-8 rounded flex items-center justify-center bg-red-500 hover:bg-red-600 text-white`}
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={() => store.sendMessage()}
            title={t('send')}
            disabled={!store.canSend}
            className={`shrink-0 w-8 h-8 rounded flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed ${tw.primary.bg} ${tw.primary.bgHover}`}
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <p className={`text-xs ${tw.text.tertiary}`}>{t('sendHint')}</p>
    </div>
  )
})
