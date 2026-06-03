import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import dateFormat from 'licia/dateFormat'
import { tw } from 'share/theme'
import CenteredMessage from './CenteredMessage'
import store from '../store'

export default observer(function CommitList() {
  const { t } = useTranslation()

  if (!store.selectedBranch) {
    return <CenteredMessage>{t('selectBranchHint')}</CenteredMessage>
  }

  if (store.loadingCommits) {
    return <CenteredMessage>{t('loading')}</CenteredMessage>
  }

  if (store.commits.length === 0) {
    return <CenteredMessage>{t('noCommits')}</CenteredMessage>
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className={`px-3 py-2 text-xs font-medium border-b ${tw.border} ${tw.text.secondary}`}
      >
        {t('history')}
      </div>
      <div className="flex-1 overflow-y-auto">
        {store.commits.map((commit) => {
          const selected = store.selectedCommit?.sha === commit.sha
          return (
            <button
              key={commit.sha}
              type="button"
              onClick={() => store.selectCommit(commit)}
              className={`w-full text-left px-3 py-2 border-b ${tw.border} ${
                tw.hover
              } ${selected ? tw.active : ''}`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`font-mono text-xs shrink-0 ${tw.text.secondary}`}
                >
                  {commit.shortSha}
                </span>
                <span className={`text-sm truncate ${tw.text.primary}`}>
                  {commit.summary}
                </span>
              </div>
              <div className={`text-xs mt-1 ${tw.text.secondary}`}>
                {commit.author} ·{' '}
                {dateFormat(new Date(commit.date), 'yyyy-mm-dd HH:MM')}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})
