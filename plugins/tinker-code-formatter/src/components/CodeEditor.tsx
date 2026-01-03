import { Editor } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import type { Monaco } from '@monaco-editor/react'
import store from '../store'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  height: string
}

export default observer(function CodeEditor({
  value,
  onChange,
  language,
  height,
}: CodeEditorProps) {
  const handleChange = (val: string | undefined) => {
    onChange(val || '')
  }

  const handleEditorWillMount = (monaco: Monaco) => {
    // 禁用 TypeScript 和 JavaScript 的语法错误提示
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
  }

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={handleChange}
      beforeMount={handleEditorWillMount}
      theme={store.isDark ? 'vs-dark' : 'vs-light'}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
      }}
    />
  )
})
