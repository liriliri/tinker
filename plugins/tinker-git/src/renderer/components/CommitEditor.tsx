import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import { Toolbar } from 'share/components/Toolbar'
import { formatCommitListDate } from '../lib/util'
import CenteredMessage from './CenteredMessage'
import store from '../store'

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on' as const,
  readOnly: true,
  fontSize: 13,
}

export default observer(function CommitEditor() {
  const { t } = useTranslation()
  const commit = store.selectedCommit

  if (!commit) {
    return <CenteredMessage>{t('selectCommitHint')}</CenteredMessage>
  }

  const { label: dateLabel, title: dateTitle } = formatCommitListDate(
    commit.date
  )

  const handleCopySha = async () => {
    try {
      await navigator.clipboard.writeText(commit.sha)
      toast.success(t('copySuccess'))
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      <Toolbar className="min-w-0 overflow-hidden gap-2">
        <span className={`text-xs shrink-0 ${tw.text.secondary}`}>
          {commit.author}
        </span>
        <span
          className={`text-xs truncate min-w-0 flex-1 ${tw.text.primary}`}
          title={commit.summary}
        >
          {commit.summary}
        </span>
        <span
          onClick={handleCopySha}
          className={`font-mono text-xs shrink-0 ${tw.text.secondary} ${tw.primary.textHover} cursor-pointer transition-colors`}
          title={t('clickToCopy')}
        >
          {commit.shortSha}
        </span>
        <span
          className={`text-xs shrink-0 tabular-nums ${tw.text.secondary}`}
          title={dateTitle}
        >
          {dateLabel}
        </span>
      </Toolbar>

      {store.loadingDetail ? (
        <CenteredMessage>{t('loading')}</CenteredMessage>
      ) : (
        <div className="flex-1 min-h-0">
          <Editor
            value={store.editorContent}
            language="diff"
            options={EDITOR_OPTIONS}
            theme={store.isDark ? 'vs-dark' : 'vs'}
          />
        </div>
      )}
    </div>
  )
})
