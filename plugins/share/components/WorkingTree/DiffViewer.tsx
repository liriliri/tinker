import { Editor, DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import { getLanguage } from '../../lib/fileType'
import {
  configureMonacoEditor,
  READ_ONLY_EDITOR_OPTIONS,
} from '../../lib/monaco'
import {
  isNewWorkingTreeFile,
  isRenameWorkingTreeFile,
  isSubmoduleWorkingTreeFile,
  statusLetterClass,
  workingTreeFilePathLabel,
} from '../../lib/workingTree'
import type {
  GitWorkingTreeFile,
  GitWorkingTreeFileDiffContent,
} from '../../types/git'
import { tw } from '../../theme'
import { Toolbar } from '../Toolbar'
import CenteredMessage from './CenteredMessage'
import { WORKING_TREE_NS } from './i18n'

export interface WorkingTreeDiffViewerProps {
  file: GitWorkingTreeFile | null
  diffContent: GitWorkingTreeFileDiffContent | null
  loading: boolean
  isDark: boolean
  emptyState?: React.ReactNode
  headerVariant?: 'toolbar' | 'bar' | 'none'
}

function DiffViewerHeaderLabels({
  file,
  pathLabel,
}: {
  file: GitWorkingTreeFile
  pathLabel: string
}) {
  return (
    <>
      <span
        className={`text-xs font-mono truncate min-w-0 flex-1 ${tw.text.primary}`}
        title={pathLabel}
      >
        {pathLabel}
      </span>
      <span
        className={`text-xs shrink-0 font-mono font-semibold ${statusLetterClass(
          file.status
        )}`}
        title={file.status}
      >
        {file.statusLetter}
      </span>
    </>
  )
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

  const language = isSubmoduleWorkingTreeFile(file)
    ? getLanguage(`${file.path}.diff`)
    : getLanguage(file.path)
  const theme = isDark ? 'vs-dark' : 'vs-light'
  const pathLabel = workingTreeFilePathLabel(file)

  const header =
    headerVariant === 'none' ? null : headerVariant === 'toolbar' ? (
      <Toolbar className="min-w-0 overflow-hidden gap-2">
        <DiffViewerHeaderLabels file={file} pathLabel={pathLabel} />
      </Toolbar>
    ) : (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 min-w-0 border-b ${tw.border} ${tw.bg.secondary}`}
      >
        <DiffViewerHeaderLabels file={file} pathLabel={pathLabel} />
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
    if (isNewWorkingTreeFile(file) || isSubmoduleWorkingTreeFile(file)) {
      return (
        <div className="flex-1 min-h-0">
          <Editor
            key={file.id}
            value={diffContent.modified}
            language={language}
            theme={theme}
            beforeMount={configureMonacoEditor}
            options={READ_ONLY_EDITOR_OPTIONS}
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
          beforeMount={configureMonacoEditor}
          options={{
            ...READ_ONLY_EDITOR_OPTIONS,
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
