import { observer } from 'mobx-react-lite'
import { Globe } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function NewTabPage() {
  const { t } = useTranslation()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = (e.target as HTMLInputElement).value
      if (value.trim()) {
        store.navigate(value)
      }
    }
  }

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center ${tw.bg.primary}`}
    >
      <Globe size={48} className={`mb-6 ${tw.text.tertiary}`} />
      <input
        type="text"
        autoFocus
        className={`w-80 px-4 py-2 text-sm rounded-lg border ${tw.border} ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-2 ${tw.primary.focusRing}`}
        placeholder={t('searchOrUrl')}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
})
