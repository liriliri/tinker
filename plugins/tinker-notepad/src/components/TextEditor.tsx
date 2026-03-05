import { observer } from 'mobx-react-lite'
import { Editor, useMonaco } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import store from '../store'
import { detectLanguage } from '../lib/languages'
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
  const monaco = useMonaco()
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    ...EDITOR_OPTIONS,
    fontSize: store.fontSize,
  }

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

      if (monaco && store.currentFilePath) {
        const lang = detectLanguage(store.currentFilePath, monaco.languages)
        store.setLanguage(lang)
        monaco.editor.setModelLanguage(model, lang)
      }
    }

    editor.onDidChangeCursorPosition((e) => {
      store.setCursor(e.position.lineNumber, e.position.column)
    })
  }

  useEffect(() => {
    if (!monaco) return
    if (store.currentFilePath) {
      const lang = detectLanguage(store.currentFilePath, monaco.languages)
      store.setLanguage(lang)
      const model = editorRef.current?.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, lang)
      }
    }
  }, [monaco])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !monaco) return

    const model = editor.getModel()
    model?.setValue(store.content)
    store.updateUndoRedoState()

    const lang = store.currentFilePath
      ? detectLanguage(store.currentFilePath, monaco.languages)
      : 'plaintext'
    store.setLanguage(lang)
    if (model) {
      monaco.editor.setModelLanguage(model, lang)
    }
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
