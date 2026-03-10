import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { useEffect, useMemo, useRef } from 'react'
import store from '../store'
import type { editor } from 'monaco-editor'

const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on',
  unicodeHighlight: {
    ambiguousCharacters: false,
    invisibleCharacters: false,
  },
}

export default observer(function TextEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const editorOptions = useMemo(
    () => ({ ...EDITOR_OPTIONS, fontSize: store.fontSize }),
    [store.fontSize]
  )

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setContent(value)
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

    editor.onDidChangeCursorPosition((e) => {
      store.setCursor(e.position.lineNumber, e.position.column)
    })
  }

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const model = editor.getModel()
    model?.setValue(store.content)
    store.updateUndoRedoState()
  }, [store.fileVersion])

  return (
    <div className="h-full w-full">
      <Editor
        defaultValue={store.content}
        language={store.language}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={editorOptions}
        theme={store.isDark ? 'vs-dark' : 'vs'}
      />
    </div>
  )
})
