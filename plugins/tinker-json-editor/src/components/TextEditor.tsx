import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import store from '../store'

interface TextEditorProps {
  isDark: boolean
}

export default observer(function TextEditor({ isDark }: TextEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setJsonInput(value)
    }
  }

  return (
    <div className="h-full w-full">
      <Editor
        value={store.jsonInput}
        language="json"
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
          formatOnType: true,
        }}
        theme={isDark ? 'vs-dark' : 'vs'}
      />
    </div>
  )
})
