import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Eraser, FolderOpen } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../../theme'
import { LoadingCircle } from '../Loading'
import TextInput from '../TextInput'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from '../Toolbar'
import IncludeExcludePanel from './IncludeExcludePanel'
import { useTextSearchContext } from './context'
import { TEXT_SEARCH_NS } from './namespace'

export default observer(function SearchHeader() {
  const { t } = useTranslation(TEXT_SEARCH_NS)
  const { search, showFolderPicker = true } = useTextSearchContext()

  const summary = (() => {
    if (!search.rootDir) return t('noFolder')
    if (!search.query.trim()) return t('noQuery')
    if (search.searching && search.totalMatches === 0) return ''
    if (search.totalMatches === 0) return t('noResults')
    const text = t('summary', {
      count: search.totalMatches,
      matches: search.totalMatches,
      files: search.totalFiles,
    })
    return search.truncated ? `${text} ${t('truncated')}` : text
  })()

  return (
    <div className={`shrink-0 ${tw.text.primary}`}>
      <Toolbar>
        {showFolderPicker && (
          <>
            <ToolbarButton
              onClick={() => search.pickFolder()}
              title={search.rootDir || t('pickFolder')}
            >
              <FolderOpen size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
            <ToolbarSeparator />
          </>
        )}
        <ToolbarTextInput
          type="number"
          min={1}
          value={search.maxResults}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v) && v > 0) search.setMaxResults(v)
          }}
          className="!w-20"
          title={t('maxResults')}
        />
        <ToolbarSpacer />
        <ToolbarButton onClick={() => search.clear()} title={t('clear')}>
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          variant="toggle"
          active={search.showInclude}
          onClick={() => search.setShowInclude(!search.showInclude)}
          title={t('toggleSearchDetails')}
        >
          {search.showInclude ? (
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
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={`pr-24 focus:ring-2 ${tw.primary.focusRing}`}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <ToggleIconButton
                active={search.caseSensitive}
                onClick={() => search.setCaseSensitive(!search.caseSensitive)}
                title={t('caseSensitive')}
              >
                <span className="font-semibold text-[11px]">Aa</span>
              </ToggleIconButton>
              <ToggleIconButton
                active={search.wholeWord}
                onClick={() => search.setWholeWord(!search.wholeWord)}
                title={t('wholeWord')}
              >
                <span className="font-semibold text-[11px]">ab|</span>
              </ToggleIconButton>
              <ToggleIconButton
                active={search.regex}
                onClick={() => search.setRegex(!search.regex)}
                title={t('regex')}
              >
                <span className="font-mono text-[11px]">.*</span>
              </ToggleIconButton>
            </div>
          </div>

          {search.showInclude && <IncludeExcludePanel />}
        </div>

        <div
          className={`flex items-center justify-center gap-1.5 text-[11px] px-2 py-1 border-t ${tw.border} ${tw.text.secondary} min-h-[1.5rem]`}
        >
          {search.searching && <LoadingCircle className="w-3 h-3" />}
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
