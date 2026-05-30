import { Editor, loader } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import type { editor } from 'monaco-editor'
import store from '../store'
import { getLanguage } from '../lib/util'

loader.init().then((monaco) => {
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

  useEffect(() => {
    return () => store.unregisterEditor(tabId)
  }, [tabId])

  if (!tab) return null

  const handleChange = (value: string | undefined) => {
    store.updateContent(tabId, value || '')
  }

  const handleMount = (instance: editor.IStandaloneCodeEditor) => {
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
        minimap: { enabled: true },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'off',
        renderWhitespace: 'selection',
      }}
    />
  )
})
