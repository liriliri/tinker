import { Editor } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { editor } from 'monaco-editor'
import store from '../store'
import { getLanguage } from 'share/lib/fileType'
import { getMonacoApi, initMonacoApi } from 'share/lib/monaco'
import { useBlameDecorations } from 'share/hooks/useBlameDecorations'
import { formatRelativeDate, formatTimeAgo } from 'share/lib/util'
import ImageViewer from 'share/components/ImageViewer'
import GitDiffPane from './GitDiffPane'

initMonacoApi()

interface EditorPaneProps {
  tabId: string
}

export default observer(function EditorPane({ tabId }: EditorPaneProps) {
  const { i18n } = useTranslation()
  const tab = store.tabs.find((t) => t.id === tabId)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const blameAnnotations = useMemo(
    () =>
      (tab?.blameLineAnnotations ?? []).map((annotation) => {
        if (!annotation.isLeader || !annotation.dateMs) {
          return { ...annotation, date: '', dateTitle: undefined }
        }

        const { title } = formatRelativeDate(annotation.dateMs, i18n.language)

        return {
          lineNumber: annotation.lineNumber,
          isLeader: annotation.isLeader,
          sha: annotation.sha,
          text: annotation.text,
          date: formatTimeAgo(annotation.dateMs, i18n.language, 'narrow'),
          dateTitle: title,
        }
      }),
    [tab?.blameLineAnnotations, i18n.language]
  )

  useEffect(() => {
    return () => store.unregisterEditor(tabId)
  }, [tabId])

  const handleHighlightClick = useCallback((sha: string) => {
    store.setHighlightedBlameSha(sha)
  }, [])

  useBlameDecorations({
    editorRef,
    monacoApi: getMonacoApi(),
    annotations: blameAnnotations,
    highlightedSha: tab?.highlightedBlameSha ?? null,
    showBlame: (tab?.showingBlame ?? false) && tab?.id === store.activeTabId,
    onHighlightClick: handleHighlightClick,
  })

  if (!tab) return null

  if (tab.category === 'gitDiff') {
    return <GitDiffPane tabId={tabId} />
  }

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
