import { useEffect, useRef } from 'react'
import JSONEditor, { JSONEditorOptions } from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'

interface TreeEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

export default function TreeEditor({
  value,
  onChange,
  readOnly = false,
}: TreeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<JSONEditor | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const options: JSONEditorOptions = {
      mode: 'tree',
      modes: ['tree', 'view', 'form'],
      mainMenuBar: false,
      navigationBar: false,
      statusBar: false,
      onChangeText: (jsonString: string) => {
        if (onChange && !readOnly) {
          onChange(jsonString)
        }
      },
    }

    editorRef.current = new JSONEditor(containerRef.current, options)

    // Set initial value
    try {
      const json = value ? JSON.parse(value) : {}
      editorRef.current.set(json)
    } catch (err) {
      console.error('Invalid JSON:', err)
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [])

  // Update editor when value changes externally
  useEffect(() => {
    if (editorRef.current && value) {
      try {
        const json = JSON.parse(value)
        const currentJson = editorRef.current.get()

        // Only update if content is different to avoid cursor jumps
        if (JSON.stringify(currentJson) !== JSON.stringify(json)) {
          editorRef.current.update(json)
        }
      } catch (err) {
        console.error('Invalid JSON:', err)
      }
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="w-full h-full jsoneditor-react-container"
      style={{
        border: 'none',
      }}
    />
  )
}
