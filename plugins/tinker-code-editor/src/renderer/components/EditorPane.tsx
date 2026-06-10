import { Editor, loader } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useCallback } from 'react'
import type { editor } from 'monaco-editor'
import store from '../store'
import { getLanguage } from 'share/lib/fileType'
import { useBlameDecorations } from 'share/hooks/useBlameDecorations'
import ImageViewer from 'share/components/ImageViewer'

type MonacoApi = typeof import('monaco-editor')

let monacoApi: MonacoApi | null = null
loader.init().then((monaco) => {
  monacoApi = monaco as MonacoApi
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
})

interface EditorPaneProps {
  tabId: string
}

export default observer(function EditorPane({ tabId }: EditorPaneProps) {
  const tab = store.tabs.find((t) => t.id === tabId)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    return () => store.unregisterEditor(tabId)
  }, [tabId])

  const handleHighlightClick = useCallback((sha: string) => {
    store.setHighlightedBlameSha(sha)
  }, [])

  useBlameDecorations({
    editorRef,
    monacoApi,
    annotations: tab?.blameLineAnnotations ?? [],
    highlightedSha: tab?.highlightedBlameSha ?? null,
    showBlame: (tab?.showingBlame ?? false) && tab?.id === store.activeTabId,
    onHighlightClick: handleHighlightClick,
  })

  if (!tab) return null

  if (tab.category === 'image') {
    return (
      <div className="w-full h-full">
        <ImageViewer src={tab.content} />
      </div>
    )
  }

  const handleChange = (value: string | undefined) => {
    if (tab.showingBlame) return
    store.updateContent(tabId, value || '')
  }

  const handleMount = (instance: editor.IStandaloneCodeEditor) => {
    editorRef.current = instance
    store.registerEditor(tabId, instance)
    const updateCursor = () => {
      const position = instance.getPosition()
      if (position) {
        store.setCursor(position.lineNumber, position.column)
      }
    }
    instance.onDidChangeCursorPosition(updateCursor)
    instance.onDidFocusEditorWidget(updateCursor)
  }

  return (
    <Editor
      language={getLanguage(tab.filePath)}
      value={tab.content}
      onChange={handleChange}
      onMount={handleMount}
      theme={store.isDark ? 'vs-dark' : 'vs-light'}
      options={{
        readOnly: tab.showingBlame,
        minimap: { enabled: !tab.showingBlame },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'off',
        renderWhitespace: 'selection',
        ...(tab.showingBlame
          ? {
              guides: { indentation: false },
              occurrencesHighlight: 'off',
              glyphMargin: false,
            }
          : {}),
      }}
    />
  )
})
