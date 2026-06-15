import { Editor, DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import type { Monaco } from '@monaco-editor/react'
import { getLanguage } from '../../lib/fileType'
import {
  fileDisplayName,
  isNewWorkingTreeFile,
  isRenameWorkingTreeFile,
  workingTreeFilePathLabel,
} from '../../lib/workingTree'
import type {
  GitWorkingTreeFile,
  GitWorkingTreeFileDiffContent,
} from '../../types/git'
import { tw } from '../../theme'
import { Toolbar, ToolbarSeparator } from '../Toolbar'
import CenteredMessage from './CenteredMessage'
import { WORKING_TREE_NS } from './i18n'

const DIFF_EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'off' as const,
}

function disableMonacoValidation(monaco: Monaco) {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
}

export interface WorkingTreeDiffViewerProps {
  file: GitWorkingTreeFile | null
  diffContent: GitWorkingTreeFileDiffContent | null
  loading: boolean
  isDark: boolean
  emptyState?: React.ReactNode
  headerVariant?: 'toolbar' | 'bar' | 'none'
}

export default function WorkingTreeDiffViewer({
  file,
  diffContent,
  loading,
  isDark,
  emptyState = null,
  headerVariant = 'toolbar',
}: WorkingTreeDiffViewerProps) {
  const { t } = useTranslation(WORKING_TREE_NS)

  if (!file) {
    return emptyState
  }

  const language = getLanguage(file.path)
  const theme = isDark ? 'vs-dark' : 'vs-light'
  const pathLabel = workingTreeFilePathLabel(file)

  const header =
    headerVariant === 'none' ? null : headerVariant === 'toolbar' ? (
      <Toolbar className="min-w-0 overflow-hidden gap-2">
        <span
          className={`text-xs font-mono truncate min-w-0 flex-1 ${tw.text.primary}`}
          title={file.path}
        >
          {fileDisplayName(file)}
        </span>
        <span
          className={`text-xs shrink-0 truncate max-w-[40%] ${tw.text.secondary}`}
          title={pathLabel}
        >
          {pathLabel}
        </span>
        <ToolbarSeparator />
        <span
          className={`text-xs shrink-0 font-mono ${tw.text.secondary}`}
          title={file.status}
        >
          {file.statusLetter}
        </span>
      </Toolbar>
    ) : (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 min-w-0 border-b ${tw.border} ${tw.bg.secondary}`}
      >
        <span
          className={`text-xs font-mono truncate min-w-0 flex-1 ${tw.text.primary}`}
          title={file.path}
        >
          {fileDisplayName(file)}
        </span>
        <span
          className={`text-xs shrink-0 truncate max-w-[40%] ${tw.text.secondary}`}
          title={pathLabel}
        >
          {pathLabel}
        </span>
        <span
          className={`text-xs shrink-0 font-mono ${tw.text.secondary}`}
          title={file.status}
        >
          {file.statusLetter}
        </span>
      </div>
    )

  const renderBody = () => {
    if (loading && !diffContent) {
      return <CenteredMessage>{t('loading')}</CenteredMessage>
    }
    if (!diffContent) {
      return <CenteredMessage>{t('noDiffs')}</CenteredMessage>
    }
    if (diffContent.isTooLarge) {
      return <CenteredMessage>{t('diffUnrenderable')}</CenteredMessage>
    }
    if (diffContent.isBinary) {
      return <CenteredMessage>{t('binaryDiffNotSupported')}</CenteredMessage>
    }
    if (isNewWorkingTreeFile(file)) {
      return (
        <div className="flex-1 min-h-0">
          <Editor
            key={file.id}
            value={diffContent.modified}
            language={language}
            theme={theme}
            beforeMount={disableMonacoValidation}
            options={DIFF_EDITOR_OPTIONS}
          />
        </div>
      )
    }
    if (
      diffContent.original === diffContent.modified &&
      !isRenameWorkingTreeFile(file)
    ) {
      return <CenteredMessage>{t('noDiffs')}</CenteredMessage>
    }

    return (
      <div className="flex-1 min-h-0">
        <MonacoDiffEditor
          key={file.id}
          original={diffContent.original}
          modified={diffContent.modified}
          language={language}
          theme={theme}
          beforeMount={disableMonacoValidation}
          options={{
            ...DIFF_EDITOR_OPTIONS,
            renderSideBySide: true,
            enableSplitViewResizing: true,
            renderOverviewRuler: true,
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      {header}
      {renderBody()}
    </div>
  )
}
