import { Editor, loader } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { editor as MonacoEditor } from 'monaco-editor'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import splitPath from 'licia/splitPath'
import { GitCommit } from 'lucide-react'
import { BINARY_EXTS, getFileExt, getLanguage } from 'share/lib/fileType'
import { formatRelativeDate, formatTimeAgo } from 'share/lib/util'
import { useBlameDecorations } from 'share/hooks/useBlameDecorations'
import ImageViewer from 'share/components/ImageViewer'
import CenteredMessage from './CenteredMessage'
import store from '../store'

type MonacoApi = typeof import('monaco-editor')

let monacoApi: MonacoApi | null = null
loader.init().then((m) => {
  monacoApi = m as MonacoApi
})

function isBinaryFile(filePath: string): boolean {
  const ext = getFileExt(filePath)
  return BINARY_EXTS.has(ext)
}

export default observer(function CommitFileViewer() {
  const { t, i18n } = useTranslation()
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)

  const blameAnnotations = useMemo(
    () =>
      store.blameLineAnnotations.map((annotation) => {
        if (!annotation.isLeader || !annotation.dateMs) {
          return { ...annotation, date: '', dateTitle: undefined }
        }

        const { title } = formatRelativeDate(annotation.dateMs, i18n.language)

        return {
          ...annotation,
          date: formatTimeAgo(annotation.dateMs, i18n.language, 'narrow'),
          dateTitle: title,
        }
      }),
    [store.blameLineAnnotations, i18n.language]
  )

  const handleHighlightClick = useCallback((sha: string) => {
    store.setHighlightedBlameSha(sha)
  }, [])

  useBlameDecorations({
    editorRef,
    monacoApi,
    annotations: blameAnnotations,
    highlightedSha: store.highlightedBlameSha,
    showBlame: store.showingBlame,
    onHighlightClick: handleHighlightClick,
  })

  if (!store.selectedFilePath) {
    return <CenteredMessage>{t('selectFileToView')}</CenteredMessage>
  }

  const { name: baseName, ext } = splitPath(store.selectedFilePath)
  const fileName = baseName + ext || store.selectedFilePath
  const binary = isBinaryFile(store.selectedFilePath)
  const isImage = store.fileCategory === 'image'

  if (isImage) {
    return (
      <div className="h-full w-full flex flex-col min-w-0">
        <Toolbar>
          <span className={`text-xs font-mono ${tw.text.secondary}`}>
            {fileName}
          </span>
        </Toolbar>
        <div className="flex-1 min-h-0">
          <ImageViewer src={store.fileContent} />
        </div>
      </div>
    )
  }

  function handleEditorMount(editor: MonacoEditor.IStandaloneCodeEditor) {
    editorRef.current = editor
    // Suppress language diagnostics for read-only commit viewer
    const model = editor.getModel()
    if (model && monacoApi) {
      const clearMarkers = () => {
        if (model.isDisposed() || !monacoApi) return
        const markers = monacoApi.editor.getModelMarkers({
          resource: model.uri,
        })
        if (markers.length === 0) return
        const owners = new Set(markers.map((m) => m.owner))
        for (const owner of owners) {
          monacoApi.editor.setModelMarkers(model, owner, [])
        }
      }
      // Language services set markers asynchronously — clear once after delay
      setTimeout(clearMarkers, 600)
    }
  }

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      <Toolbar>
        <span className={`text-xs font-mono ${tw.text.secondary}`}>
          {fileName}
        </span>
        <div className="flex-1" />
        {!binary && (
          <ToolbarButton
            variant="toggle"
            active={store.showingBlame}
            disabled={store.loadingBlame}
            onClick={() => store.toggleBlame()}
            title={store.showingBlame ? t('blameHide') : t('blame')}
          >
            <GitCommit size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        )}
      </Toolbar>
      <div className="flex-1 min-h-0">
        <Editor
          key={store.selectedFilePath}
          language={getLanguage(store.selectedFilePath)}
          value={store.fileContent}
          theme={store.isDark ? 'vs-dark' : 'vs-light'}
          onMount={handleEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            glyphMargin: false,
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'off',
            renderWhitespace: 'selection',
            guides: {
              indentation: false,
            },
            occurrencesHighlight: 'off',
          }}
        />
      </div>
    </div>
  )
})
