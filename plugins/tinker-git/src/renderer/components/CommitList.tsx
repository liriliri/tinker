import { useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import { formatRelativeDate } from 'share/lib/util'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import AuthorAvatar from './AuthorAvatar'
import CenteredMessage from './CenteredMessage'
import store from '../store'

const SCROLL_THRESHOLD = 80

export default observer(function CommitList() {
  const { t, i18n } = useTranslation()
  const viewportRef = useRef<HTMLElement | null>(null)

  const handleScroll = useCallback(() => {
    const el = viewportRef.current
    if (
      !el ||
      !store.hasMoreCommits ||
      store.loadingMoreCommits ||
      store.loadingMoreSearch
    )
      return

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD) {
      void store.loadMoreCommits()
    }
  }, [])

  const handleViewportChange = useCallback(
    (viewport: HTMLElement | null) => {
      if (viewportRef.current) {
        viewportRef.current.removeEventListener('scroll', handleScroll)
      }
      viewportRef.current = viewport
      if (viewport) {
        viewport.addEventListener('scroll', handleScroll)
      }
    },
    [handleScroll]
  )

  if (!store.selectedBranch) {
    return <CenteredMessage>{t('selectBranchHint')}</CenteredMessage>
  }

  if (store.loadingCommits) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingCircle className="w-8 h-8" />
      </div>
    )
  }

  if (
    (store.commitSearchQuery || store.commitAuthorFilter) &&
    store.commits.length === 0 &&
    !store.searching
  ) {
    return <CenteredMessage>{t('noMatchingCommits')}</CenteredMessage>
  }

  if (store.commits.length === 0) {
    return <CenteredMessage>{t('noCommits')}</CenteredMessage>
  }

  return (
    <div className="h-full flex flex-col relative">
      {store.searching && (
        <div
          className={`absolute inset-x-0 top-0 z-10 flex items-center justify-center py-2 ${tw.bg.secondary} opacity-90`}
        >
          <LoadingCircle className="w-5 h-5" />
        </div>
      )}
      <OverlayScrollbars
        defer
        className="flex-1"
        onViewportChange={handleViewportChange}
      >
        {store.commits.map((commit) => {
          const selected = store.selectedCommit?.sha === commit.sha
          const { label, title } = formatRelativeDate(
            commit.date,
            i18n.language
          )
          return (
            <button
              key={commit.sha}
              type="button"
              onClick={() => store.selectCommit(commit)}
              className={`w-full text-left px-3 py-2 border-b ${tw.border} ${
                tw.hover
              } ${
                selected
                  ? `${tw.active} border-l-2 ${tw.primary.border}`
                  : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <AuthorAvatar name={commit.author} email={commit.email} />
                <span
                  className={`truncate text-sm font-medium ${tw.text.primary}`}
                >
                  {commit.summary}
                </span>
                <span
                  className={`text-xs shrink-0 ml-auto ${tw.text.tertiary}`}
                  title={title}
                >
                  {label}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5 ml-7">
                <span className={`truncate text-xs ${tw.text.secondary}`}>
                  {commit.author}
                </span>
                <span
                  className={`text-[11px] font-mono shrink-0 ml-2 ${tw.text.tertiary} bg-black/5 dark:bg-white/10 rounded px-1.5 py-px`}
                >
                  {commit.shortSha}
                </span>
              </div>
            </button>
          )
        })}
        {store.loadingMoreCommits && (
          <div className="flex items-center justify-center py-3">
            <LoadingCircle className="w-5 h-5" />
          </div>
        )}
        {store.loadingMoreSearch && (
          <div className="flex items-center justify-center py-3">
            <LoadingCircle className="w-5 h-5" />
          </div>
        )}
      </OverlayScrollbars>
    </div>
  )
})
