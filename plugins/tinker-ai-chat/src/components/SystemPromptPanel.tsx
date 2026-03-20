import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function SystemPromptPanel() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className={`border-b ${tw.border}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs ${tw.hover} ${tw.text.tertiary}`}
      >
        <Settings size={12} />
        <span>{t('systemPrompt')}</span>
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-2">
          <textarea
            value={store.systemPrompt}
            onChange={(e) => store.setSystemPrompt(e.target.value)}
            placeholder={t('systemPromptPlaceholder')}
            rows={3}
            className={`w-full resize-none rounded border px-2 py-1.5 text-xs outline-none focus:ring-1 ${tw.bg.input} ${tw.border} ${tw.text.primary} focus:ring-blue-500`}
          />
        </div>
      )}
    </div>
  )
})
