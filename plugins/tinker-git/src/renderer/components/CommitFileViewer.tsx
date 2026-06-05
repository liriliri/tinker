import { Editor, loader } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useCallback } from 'react'
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
  const decorationIdsRef = useRef<string[]>([])
  const highlightDecoIdsRef = useRef<string[]>([])

  // Apply blame decorations (before content for text, className for highlight)
  const applyBlameDecorations = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !monacoApi) return

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      []
    )

    if (!store.showingBlame || store.blameLineAnnotations.length === 0) {
      return
    }

    const annotations = store.blameLineAnnotations
    const highlightedSha = store.highlightedBlameSha

    const decorations: MonacoEditor.IModelDeltaDecoration[] = []
    for (const a of annotations) {
      const base = {
        range: new monacoApi!.Range(a.lineNumber, 1, a.lineNumber, 1),
      }
      const hl = highlightedSha && a.sha === highlightedSha
      if (a.isLeader) {
        decorations.push({
          ...base,
          options: {
            showIfCollapsed: true,
            before: {
              content: a.text,
              inlineClassName: hl
                ? 'blame-before blame-before--msg blame-before--hl'
                : 'blame-before blame-before--msg',
            },
          },
        })
        decorations.push({
          ...base,
          options: {
            showIfCollapsed: true,
            before: {
              content: a.date,
              inlineClassName: hl
                ? 'blame-before blame-before--date blame-before--hl'
                : 'blame-before blame-before--date',
            },
          },
        })
      } else {
        decorations.push({
          ...base,
          options: {
            showIfCollapsed: true,
            before: {
              content: '\u00a0',
              inlineClassName: hl
                ? 'blame-before blame-before--compact blame-before--hl'
                : 'blame-before blame-before--compact',
            },
          },
        })
      }
    }

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      decorations
    )
  }, [])

  // Apply highlight decorations for selected SHA
  const applyHighlightDecorations = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !monacoApi) return

    highlightDecoIdsRef.current = editor.deltaDecorations(
      highlightDecoIdsRef.current,
      []
    )

    const sha = store.highlightedBlameSha
    if (!sha || !store.showingBlame) return

    const lines = store.blameLineAnnotations.filter((a) => a.sha === sha)
    if (lines.length === 0) return

    const decos: MonacoEditor.IModelDeltaDecoration[] = lines.map((a) => ({
      range: new monacoApi!.Range(a.lineNumber, 1, a.lineNumber, 1),
      options: {
        description: 'git-blame-highlight',
        isWholeLine: true,
        className: 'blame-line-highlight',
      },
    }))

    highlightDecoIdsRef.current = editor.deltaDecorations(
      highlightDecoIdsRef.current,
      decos
    )
  }, [])

  // Apply decorations when blame or file changes
  useEffect(() => {
    applyBlameDecorations()
    applyHighlightDecorations()
    return () => {
      const editor = editorRef.current
      if (editor) {
        editor.deltaDecorations(decorationIdsRef.current, [])
        editor.deltaDecorations(highlightDecoIdsRef.current, [])
        decorationIdsRef.current = []
        highlightDecoIdsRef.current = []
      }
    }
  }, [applyBlameDecorations, applyHighlightDecorations, store.showingBlame, store.blameLineAnnotations, store.fileContent])

  // Mouse click handler — detect clicks on lines and toggle highlight for matching SHA
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const disposable = editor.onMouseDown((e) => {
      if (!e.target.position || !store.showingBlame) return
      const lineNumber = e.target.position.lineNumber
      const annotation = store.blameLineAnnotations.find(
        (a) => a.lineNumber === lineNumber
      )
      if (annotation) {
        store.setHighlightedBlameSha(annotation.sha)
      }
    })

    return () => disposable.dispose()
  }, [store.showingBlame])

  // Apply highlight when highlightedSha changes (also re-apply blame for gutter highlight)
  useEffect(() => {
    applyBlameDecorations()
    applyHighlightDecorations()
  }, [store.highlightedBlameSha, applyBlameDecorations, applyHighlightDecorations])

  if (!store.selectedFilePath) {
    return <CenteredMessage>{t('selectFileToView')}</CenteredMessage>
  }

  const fileName =
    store.selectedFilePath.split('/').pop() || store.selectedFilePath
  const binary = isBinaryFile(store.selectedFilePath)

  function handleEditorMount(editor: MonacoEditor.IStandaloneCodeEditor) {
    editorRef.current = editor
    applyBlameDecorations()
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
          }}
        />
      </div>
    </div>
  )
})
