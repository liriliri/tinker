import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import store from '../store'
import type { editor } from 'monaco-editor'
import { initEditor } from '../lib/monacoExtra'

export default observer(function DiagramEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorWillMount = (monaco: Monaco) => {
    initEditor(monaco as typeof import('monaco-editor'))
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setCodeInput(value)
    }
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    store.setEditorInstance(editor)

    const model = editor.getModel()
    if (model) {
      model.onDidChangeContent(() => {
        store.updateUndoRedoState()
      })
    }
  }

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (model && model.getValue() !== store.codeInput) {
      model.setValue(store.codeInput)
    }
  }, [store.codeInput])

  return (
    <div className="h-full w-full">
      <Editor
        defaultValue={store.codeInput}
        language="mermaid"
        beforeMount={handleEditorWillMount}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly: false,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: false,
          formatOnType: false,
          unicodeHighlight: {
            ambiguousCharacters: false,
            invisibleCharacters: false,
          },
        }}
        theme={store.isDark ? 'mermaid-dark' : 'mermaid'}
      />
    </div>
  )
})
