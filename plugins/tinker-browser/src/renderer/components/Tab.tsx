import { observer } from 'mobx-react-lite'
import { X, Loader2, Globe } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import store from '../store'
import type { ITab } from '../../common/types'

interface TabProps {
  tab: ITab
  isFirst: boolean
  showSeparator: boolean
}

export default observer(function Tab({
  tab,
  isFirst,
  showSeparator,
}: TabProps) {
  const { t } = useTranslation()
  const isActive = store.activeTabId === tab.id

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    store.closeTab(tab.id)
  }

  return (
    <div
      className={`group relative flex items-center h-full max-w-[240px] min-w-[72px] cursor-pointer transition-colors duration-100 ${
        isActive
          ? `${tw.bg.secondary} z-[2]`
          : `${tw.bg.tertiary} hover:bg-black/[0.06] dark:hover:bg-white/[0.08] z-[1]`
      }`}
      style={{ flex: '1 1 0', minWidth: '72px' }}
      onClick={() => store.setActiveTab(tab.id)}
    >
      {isActive ? (
        <>
          <div
            className={`pointer-events-none absolute inset-0 border-x border-t ${
              tw.border
            } ${isFirst ? 'border-l-transparent' : ''}`}
          />
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px ${tw.bg.secondary}`}
          />
        </>
      ) : (
        <div
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
        />
      )}
      {/* Separator: always in DOM, visibility toggled */}
      <div
        className={`absolute -right-px top-1/4 bottom-1/4 w-px z-[3] ${
          tw.bg.border
        } ${showSeparator ? 'visible' : 'invisible'}`}
      />
      <div className="flex items-center overflow-hidden flex-1 min-w-0 ml-2.5">
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {tab.isLoading ? (
            <Loader2 size={14} className={`animate-spin ${tw.text.tertiary}`} />
          ) : tab.favicon ? (
            <img src={tab.favicon} className="w-4 h-4" alt="" />
          ) : (
            <Globe size={14} className={tw.text.tertiary} />
          )}
        </div>
        <span
          className={`text-xs truncate flex-1 min-w-0 ml-2.5 ${
            isActive ? tw.text.primary : tw.text.secondary
          }`}
        >
          {tab.title || (tab.url ? tab.url : t('newTab'))}
        </span>
      </div>
      <button
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full mr-1.5 transition-all duration-100 opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/10 ${
          isActive ? '!opacity-70' : ''
        }`}
        onClick={handleClose}
      >
        <X size={14} className={tw.text.secondary} />
      </button>
    </div>
  )
})
