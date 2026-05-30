import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Eraser, FolderOpen } from 'lucide-react'
import className from 'licia/className'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import TextInput from 'share/components/TextInput'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import IncludeExcludePanel from './IncludeExcludePanel'

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
        <ToolbarSeparator />
        <ToolbarTextInput
          type="number"
          min={1}
          value={store.maxResults}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v) && v > 0) store.setMaxResults(v)
          }}
          className="!w-20"
          title={t('maxResults')}
        />
        <ToolbarSpacer />
        <ToolbarButton onClick={() => store.clear()} title={t('clear')}>
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSeparator />
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

      <div className={`${tw.bg.secondary} border-b ${tw.border}`}>
        <div className="p-2 space-y-2">
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
        </div>

        <div
          className={`flex items-center justify-center gap-1.5 text-[11px] px-2 py-1 border-t ${tw.border} ${tw.text.secondary} min-h-[1.5rem]`}
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
        'w-6 h-6 flex items-center justify-center rounded transition-colors',
        active
          ? `${tw.primary.bgFocused} ${tw.primary.text}`
          : `${tw.text.tertiary} ${tw.hover}`
      )}
    >
      {children}
    </button>
  )
}
