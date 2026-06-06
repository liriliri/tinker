import { Editor, loader } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { editor as MonacoEditor } from 'monaco-editor'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { GitCommit } from 'lucide-react'
import { BINARY_EXTS } from 'share/lib/fileType'
import { useBlameDecorations } from 'share/hooks/useBlameDecorations'
import CenteredMessage from './CenteredMessage'
import store from '../store'

type MonacoApi = typeof import('monaco-editor')

let monacoApi: MonacoApi | null = null
loader.init().then((m) => {
  monacoApi = m as MonacoApi
})

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  md: 'markdown',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  swift: 'swift',
  kt: 'kotlin',
  dart: 'dart',
  lua: 'lua',
  toml: 'ini',
  ini: 'ini',
  vue: 'html',
  svelte: 'html',
}

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return LANGUAGE_MAP[ext] || 'plaintext'
}

function isBinaryFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return BINARY_EXTS.has(ext)
}

export default observer(function CommitFileViewer() {
  const { t } = useTranslation()
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)

  const handleHighlightClick = useCallback((sha: string) => {
    store.setHighlightedBlameSha(sha)
  }, [])

  useBlameDecorations({
    editorRef,
    monacoApi,
    annotations: store.blameLineAnnotations,
    highlightedSha: store.highlightedBlameSha,
    showBlame: store.showingBlame,
    onHighlightClick: handleHighlightClick,
  })

  if (!store.selectedFilePath) {
    return <CenteredMessage>{t('selectFileToView')}</CenteredMessage>
  }

  const fileName =
    store.selectedFilePath.split('/').pop() || store.selectedFilePath
  const binary = isBinaryFile(store.selectedFilePath)

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
