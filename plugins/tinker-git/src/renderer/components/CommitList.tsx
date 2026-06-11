import { useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import { formatRelativeDate } from 'share/lib/util'
import CenteredMessage from './CenteredMessage'
import store from '../store'

const SCROLL_THRESHOLD = 80

export default observer(function CommitList() {
  const { t, i18n } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
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
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
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
              } ${selected ? tw.active : ''}`}
            >
              <div
                className={`flex items-center justify-between gap-2 text-xs ${tw.text.secondary}`}
              >
                <span className="truncate">{commit.author}</span>
                <span className="shrink-0" title={title}>
                  {label}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_3.5rem] gap-x-2 items-center mt-1 text-xs">
                <span className={`truncate ${tw.text.primary}`}>
                  {commit.summary}
                </span>
                <span
                  className={`font-mono shrink-0 text-right ${tw.text.secondary}`}
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
      </div>
    </div>
  )
})
