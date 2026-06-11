import { Editor, DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import type { Monaco } from '@monaco-editor/react'
import { getLanguage } from 'share/lib/fileType'
import { tw } from 'share/theme'
import { Toolbar, ToolbarSeparator } from 'share/components/Toolbar'
import { fileDisplayName, isNewWorkingTreeFile } from '../lib/workingTree'
import CenteredMessage from './CenteredMessage'
import store from '../store'

function handleEditorWillMount(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
}

const EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'off' as const,
}

export default observer(function WorkingTreeDiffViewer() {
  const { t } = useTranslation()
  const file = store.selectedWorkingTreeFile
  const diffContent = store.workingTreeDiffContent
  const isNewFile = file ? isNewWorkingTreeFile(file) : false

  if (!file) {
    return <CenteredMessage>{t('selectChangeToView')}</CenteredMessage>
  }

  const language = getLanguage(file.path)
  const theme = store.isDark ? 'vs-dark' : 'vs-light'

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      <Toolbar className="min-w-0 overflow-hidden gap-2">
        <span
          className={`text-xs font-mono truncate min-w-0 flex-1 ${tw.text.primary}`}
          title={file.path}
        >
          {fileDisplayName(file)}
        </span>
        <span className={`text-xs shrink-0 ${tw.text.secondary}`}>
          {file.path}
        </span>
        <ToolbarSeparator />
        <span
          className={`text-xs shrink-0 font-mono ${tw.text.secondary}`}
          title={file.status}
        >
          {file.statusLetter}
        </span>
      </Toolbar>

      {store.loadingWorkingTreeDiff && !diffContent ? (
        <CenteredMessage>{t('loading')}</CenteredMessage>
      ) : !diffContent ? (
        <CenteredMessage>{t('noDiffs')}</CenteredMessage>
      ) : diffContent.isTooLarge ? (
        <CenteredMessage>{t('diffUnrenderable')}</CenteredMessage>
      ) : diffContent.isBinary ? (
        <CenteredMessage>{t('binaryDiffNotSupported')}</CenteredMessage>
      ) : isNewFile ? (
        <div className="flex-1 min-h-0">
          <Editor
            key={file.id}
            value={diffContent.modified}
            language={language}
            theme={theme}
            beforeMount={handleEditorWillMount}
            options={EDITOR_OPTIONS}
          />
        </div>
      ) : diffContent.original === diffContent.modified ? (
        <CenteredMessage>{t('noDiffs')}</CenteredMessage>
      ) : (
        <div className="flex-1 min-h-0">
          <MonacoDiffEditor
            key={file.id}
            original={diffContent.original}
            modified={diffContent.modified}
            language={language}
            theme={theme}
            beforeMount={handleEditorWillMount}
            options={{
              ...EDITOR_OPTIONS,
              renderSideBySide: true,
              enableSplitViewResizing: true,
              renderOverviewRuler: true,
            }}
          />
        </div>
      )}
    </div>
  )
})
