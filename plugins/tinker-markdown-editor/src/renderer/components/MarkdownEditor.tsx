import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import store from '../store'

export default observer(function MarkdownEditor() {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setMarkdownInput(value)
    }
  }

  return (
    <div className="h-full w-full">
      <Editor
        value={store.markdownInput}
        language="markdown"
        onChange={handleEditorChange}
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
        }}
        theme={store.isDark ? 'vs-dark' : 'vs'}
      />
    </div>
  )
})
