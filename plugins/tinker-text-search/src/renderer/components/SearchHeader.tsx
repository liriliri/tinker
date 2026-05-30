import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FolderOpen, Settings } from 'lucide-react'
import className from 'licia/className'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import TextInput from 'share/components/TextInput'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import IncludeExcludePanel from './IncludeExcludePanel'
import AdvancedPanel from './AdvancedPanel'

export default observer(function SearchHeader() {
  const { t } = useTranslation()

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
    <div className={`shrink-0 ${tw.text.primary}`}>
      <Toolbar>
        <ToolbarButton
          onClick={() => store.pickFolder()}
          title={store.rootDir || t('pickFolder')}
        >
          <FolderOpen size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSpacer />
        <div className="relative">
          <ToolbarButton
            variant="toggle"
            active={store.showAdvanced}
            onClick={() => store.setShowAdvanced(!store.showAdvanced)}
            title={t('advancedOptions')}
          >
            <Settings size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
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
        <ToolbarButton
          variant="toggle"
          active={store.showInclude}
          onClick={() => store.setShowInclude(!store.showInclude)}
          title={t('toggleSearchDetails')}
        >
          {store.showInclude ? (
            <ChevronDown size={TOOLBAR_ICON_SIZE} />
          ) : (
            <ChevronRight size={TOOLBAR_ICON_SIZE} />
          )}
        </ToolbarButton>
      </Toolbar>

      <div className={`${tw.bg.secondary} border-b ${tw.border} p-2 space-y-2`}>
        <div className="relative">
          <TextInput
            type="text"
            value={store.query}
            onChange={(e) => store.setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={`pr-24 focus:ring-2 ${tw.primary.focusRing}`}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
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
