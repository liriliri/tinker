import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Save, Send, Square } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import { METHOD_COLORS } from '../../lib/util'
import type { HttpMethod } from '../../common/types'

const METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]

export default observer(function UrlBar() {
  const { t } = useTranslation()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (store.loading) {
        store.abort()
      } else {
        store.send()
      }
    }
  }

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.setMethod(e.target.value as HttpMethod)
  }

  return (
    <div className="px-3 py-2">
      <div
        className={`flex items-center border ${tw.border} rounded-lg ${tw.bg.input} focus-within:ring-1 focus-within:ring-[var(--theme-primary)] focus-within:border-[var(--theme-primary)]`}
      >
        <select
          value={store.method}
          onChange={handleMethodChange}
          className={`appearance-none bg-transparent text-xs font-bold pl-3 pr-1 py-2 cursor-pointer focus:outline-none ${
            METHOD_COLORS[store.method] || tw.text.primary
          }`}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className={`w-px h-4 mx-1 ${tw.bg.border}`} />
        <input
          type="text"
          value={store.url}
          onChange={(e) => store.setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('urlPlaceholder')}
          className={`flex-1 bg-transparent px-2 py-2 text-xs ${tw.text.primary} focus:outline-none placeholder:text-gray-400`}
        />
        {!store.isTemporary && (
          <button
            onClick={() => store.saveCurrentRequest()}
            disabled={!store.isDirty}
            title={t('save')}
            className={`flex items-center px-2 py-2 text-xs ${tw.text.secondary} hover:${tw.primary.text} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Save size={14} />
          </button>
        )}
        {store.loading ? (
          <button
            onClick={() => store.abort()}
            className={`flex items-center gap-1 px-3 py-2 text-xs ${tw.text.secondary} hover:${tw.text.primary}`}
          >
            <Square size={10} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={() => store.send()}
            disabled={!store.url.trim()}
            className={`flex items-center gap-1 px-3 py-2 text-xs ${tw.primary.text} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Send size={14} />
          </button>
        )}
      </div>
    </div>
  )
})
