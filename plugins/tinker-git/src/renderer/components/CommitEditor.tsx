import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
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

  if (!store.selectedCommit) {
    return <CenteredMessage>{t('selectCommitHint')}</CenteredMessage>
  }

  if (store.loadingDetail) {
    return <CenteredMessage>{t('loading')}</CenteredMessage>
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div
        className={`px-3 py-2 text-xs font-medium border-b ${tw.border} ${tw.text.secondary}`}
      >
        {t('commitDetail')} · {store.selectedCommit.shortSha}
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          value={store.editorContent}
          language="diff"
          options={EDITOR_OPTIONS}
          theme={store.isDark ? 'vs-dark' : 'vs'}
        />
      </div>
    </div>
  )
})
