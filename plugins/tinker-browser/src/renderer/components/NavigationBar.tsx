import { observer } from 'mobx-react-lite'
import { ArrowLeft, ArrowRight, RefreshCw, X, Search } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import store from '../store'

const NAV_ICON_SIZE = 14

export default observer(function NavigationBar() {
  const { t } = useTranslation()
  const tab = store.activeTab

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      store.navigate(store.addressBarValue)
      ;(e.target as HTMLInputElement).blur()
    }
    if (e.key === 'Escape') {
      if (tab) store.setAddressBarValue(tab.url)
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    store.setAddressBarFocused(true)
    e.target.select()
  }

  const handleBlur = () => {
    store.setAddressBarFocused(false)
  }

  return (
    <div
      className={`flex items-center gap-1 px-1.5 h-10 ${tw.bg.secondary} border-b ${tw.border}`}
    >
      <button
        className={`p-1.5 rounded ${tw.hover} disabled:opacity-30 disabled:cursor-not-allowed`}
        disabled={!tab?.canGoBack}
        onClick={() => store.goBack()}
      >
        <ArrowLeft size={NAV_ICON_SIZE} className={tw.text.primary} />
      </button>
      <button
        className={`p-1.5 rounded ${tw.hover} disabled:opacity-30 disabled:cursor-not-allowed`}
        disabled={!tab?.canGoForward}
        onClick={() => store.goForward()}
      >
        <ArrowRight size={NAV_ICON_SIZE} className={tw.text.primary} />
      </button>
      <button
        className={`p-1.5 rounded ${tw.hover}`}
        onClick={() => store.reload()}
      >
        {tab?.isLoading ? (
          <X size={NAV_ICON_SIZE} className={tw.text.primary} />
        ) : (
          <RefreshCw size={NAV_ICON_SIZE} className={tw.text.primary} />
        )}
      </button>
      <div className="flex-1 relative">
        <Search
          size={12}
          className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary}`}
        />
        <input
          type="text"
          className={`w-full pl-7 pr-3 py-1 text-xs rounded border ${tw.border} ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`}
          value={store.addressBarValue}
          onChange={(e) => store.setAddressBarValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={t('searchOrUrl')}
        />
      </div>
    </div>
  )
})
