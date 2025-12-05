import { Editor } from '@monaco-editor/react'

interface TextEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  language?: string
  className?: string
}

export default function TextEditor({
  value,
  onChange,
  readOnly = false,
  language = 'json',
  className = '',
}: TextEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value)
    }
  }

  return (
    <div className={className}>
      <Editor
        value={value}
        language={language}
        onChange={handleEditorChange}
        options={{
          readOnly,
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
        theme="vs-dark"
      />
    </div>
  )
}
