import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import store from '../store'
import type { editor } from 'monaco-editor'

export default observer(function MarkdownEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setMarkdownInput(value)
    }
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // Listen to scroll events
    editor.onDidScrollChange((e) => {
      const scrollTop = e.scrollTop
      const scrollHeight = editor.getScrollHeight()
      const visibleHeight = editor.getLayoutInfo().height

      const maxScroll = scrollHeight - visibleHeight
      const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0

      // Only update if scrollPercent actually changed
      if (Math.abs(store.scrollPercent - scrollPercent) > 0.001) {
        store.setScrollPercent(scrollPercent)
      }
    })
  }

  // Sync scroll from preview to editor
  useEffect(() => {
    if (!editorRef.current) {
      return
    }

    const editor = editorRef.current
    const scrollHeight = editor.getScrollHeight()
    const visibleHeight = editor.getLayoutInfo().height
    const maxScroll = scrollHeight - visibleHeight

    if (maxScroll <= 0) return

    const currentScrollTop = editor.getScrollTop()
    const currentPercent = currentScrollTop / maxScroll

    // Only sync if there's a meaningful difference
    if (Math.abs(currentPercent - store.scrollPercent) > 0.001) {
      const targetScrollTop = maxScroll * store.scrollPercent
      editor.setScrollTop(targetScrollTop)
    }
  }, [store.scrollPercent])

  return (
    <div className="h-full w-full">
      <Editor
        value={store.markdownInput}
        language="markdown"
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
          formatOnType: false,
          unicodeHighlight: {
            ambiguousCharacters: false,
            invisibleCharacters: false,
          },
        }}
        theme={store.isDark ? 'vs-dark' : 'vs'}
      />
    </div>
  )
})
