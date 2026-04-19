import { observer } from 'mobx-react-lite'
import { ArrowLeft, ArrowRight, RefreshCw, X, Search } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function ToolbarComponent() {
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
    <Toolbar>
      <ToolbarButton
        disabled={!tab?.canGoBack}
        onClick={() => store.goBack()}
        title={t('back')}
      >
        <ArrowLeft size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        disabled={!tab?.canGoForward}
        onClick={() => store.goForward()}
        title={t('forward')}
      >
        <ArrowRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton onClick={() => store.reload()} title={t('reload')}>
        {tab?.isLoading ? (
          <X size={TOOLBAR_ICON_SIZE} />
        ) : (
          <RefreshCw size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>
      <div className="flex-1 relative">
        <Search
          size={12}
          className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary}`}
        />
        <ToolbarTextInput
          className={`w-full pl-7 pr-3 ${tw.primary.focusBorder}`}
          value={store.addressBarValue}
          onChange={(e) => store.setAddressBarValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={t('searchOrUrl')}
        />
      </div>
    </Toolbar>
  )
})
