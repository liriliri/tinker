import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import store from '../store'
import type { editor } from 'monaco-editor'

export default observer(function TextEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setJsonInput(value)
    }
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    store.setTextEditorInstance(editor)

    const model = editor.getModel()
    if (model) {
      model.onDidChangeContent(() => {
        store.updateUndoRedoState()
      })
    }
  }

  // Reset undo history when a new file is loaded
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    editor.getModel()?.setValue(store.jsonInput)
    store.updateUndoRedoState()
  }, [store.fileVersion])

  return (
    <div className="h-full w-full">
      <Editor
        defaultValue={store.jsonInput}
        language="json"
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
          formatOnPaste: true,
          formatOnType: true,
        }}
        theme={store.isDark ? 'vs-dark' : 'vs'}
      />
    </div>
  )
})
