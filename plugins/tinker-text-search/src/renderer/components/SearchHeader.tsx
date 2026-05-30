import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Folder, Settings } from 'lucide-react'
import className from 'licia/className'
import splitPath from 'licia/splitPath'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import { TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import store from '../store'
import IncludeExcludePanel from './IncludeExcludePanel'
import AdvancedPanel from './AdvancedPanel'

export default observer(function SearchHeader() {
  const { t } = useTranslation()
  const folderName = store.rootDir
    ? splitPath(store.rootDir).name || store.rootDir
    : ''

  const summary = (() => {
    if (!store.rootDir) return t('noFolder')
    if (!store.query.trim()) return t('noQuery')
    if (store.searching && store.totalMatches === 0) return ''
    if (store.totalMatches === 0) return t('noResults')
    const text = t('summary', {
      count: store.totalMatches,
      matches: store.totalMatches,
      files: store.totalFiles,
    })
    return store.truncated ? `${text} ${t('truncated')}` : text
  })()

  return (
    <div
      className={`shrink-0 ${tw.bg.secondary} border-b ${tw.border} ${tw.text.primary}`}
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => store.pickFolder()}
          className={`flex-1 flex items-center gap-1.5 min-w-0 px-1.5 py-1 rounded ${tw.hover}`}
          title={store.rootDir || t('pickFolder')}
        >
          <Folder size={TOOLBAR_ICON_SIZE} className={tw.text.tertiary} />
          <span className={`text-xs truncate ${tw.text.primary}`}>
            {folderName || t('pickFolder')}
          </span>
        </button>
        <button
          onClick={() => store.setShowInclude(!store.showInclude)}
          className={className(
            'p-1 rounded',
            store.showInclude ? tw.active : tw.hover
          )}
          title={t('toggleSearchDetails')}
        >
          {store.showInclude ? (
            <ChevronDown size={TOOLBAR_ICON_SIZE} />
          ) : (
            <ChevronRight size={TOOLBAR_ICON_SIZE} />
          )}
        </button>
      </div>

      <div className="px-2 pb-2 space-y-1.5">
        <div className="flex items-stretch gap-1">
          <div
            className={`flex-1 flex items-center gap-0.5 rounded border ${tw.border} ${tw.bg.input} focus-within:ring-1 ${tw.primary.focusRing} focus-within:border-transparent pr-1`}
          >
            <input
              type="text"
              value={store.query}
              onChange={(e) => store.setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={`flex-1 min-w-0 px-2 py-1 text-xs bg-transparent ${tw.text.primary} placeholder:${tw.text.tertiary} dark:placeholder:${tw.text.tertiary} focus:outline-none`}
            />
            <ToggleIconButton
              active={store.caseSensitive}
              onClick={() => store.setCaseSensitive(!store.caseSensitive)}
              title={t('caseSensitive')}
            >
              <span className="font-semibold text-[11px]">Aa</span>
            </ToggleIconButton>
            <ToggleIconButton
              active={store.wholeWord}
              onClick={() => store.setWholeWord(!store.wholeWord)}
              title={t('wholeWord')}
            >
              <span className="font-semibold text-[11px]">ab|</span>
            </ToggleIconButton>
            <ToggleIconButton
              active={store.regex}
              onClick={() => store.setRegex(!store.regex)}
              title={t('regex')}
            >
              <span className="font-mono text-[11px]">.*</span>
            </ToggleIconButton>
          </div>

          <div className="relative">
            <button
              onClick={() => store.setShowAdvanced(!store.showAdvanced)}
              className={className(
                'h-full p-1.5 rounded',
                store.showAdvanced ? tw.active : tw.hover
              )}
              title={t('advancedOptions')}
            >
              <Settings size={TOOLBAR_ICON_SIZE} />
            </button>
            {store.showAdvanced && (
              <>
                <div
                  className="fixed inset-0 z-[5]"
                  onClick={() => store.setShowAdvanced(false)}
                />
                <AdvancedPanel />
              </>
            )}
          </div>
        </div>

        {store.showInclude && <IncludeExcludePanel />}

        <div
          className={`flex items-center gap-1.5 text-xs ${tw.text.tertiary} min-h-[1rem]`}
        >
          {store.searching && <LoadingCircle className="w-3 h-3" />}
          <span className="truncate">{summary}</span>
        </div>
      </div>
    </div>
  )
})

interface ToggleIconButtonProps {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

function ToggleIconButton({
  active,
  onClick,
  title,
  children,
}: ToggleIconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={className(
        'p-1 rounded transition-colors',
        active
          ? `${tw.primary.bgFocused} ${tw.primary.text}`
          : `${tw.text.tertiary} ${tw.hover}`
      )}
    >
      {children}
    </button>
  )
}
