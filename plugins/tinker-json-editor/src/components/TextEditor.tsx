import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import store from '../store'
import type { editor } from 'monaco-editor'

export default observer(function TextEditor() {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setJsonInput(value)
    }
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    store.setTextEditorInstance(editor)

    const model = editor.getModel()
    if (model) {
      model.onDidChangeContent(() => {
        store.updateUndoRedoState()
      })
    }
  }

  return (
    <div className="h-full w-full">
      <Editor
        value={store.jsonInput}
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
