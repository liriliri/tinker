import { observer } from 'mobx-react-lite'
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'
import store from '../store'

interface DiffEditorProps {
  isDark: boolean
}

export default observer(function DiffEditor({ isDark }: DiffEditorProps) {
  return (
    <div className="h-full w-full">
      <MonacoDiffEditor
        original={store.originalText}
        modified={store.modifiedText}
        language="plaintext"
        theme={isDark ? 'vs-dark' : 'vs'}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderSideBySide: true,
          enableSplitViewResizing: true,
          wordWrap: 'on',
        }}
      />
    </div>
  )
})
