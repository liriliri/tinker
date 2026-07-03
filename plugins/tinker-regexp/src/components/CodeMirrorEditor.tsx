import { useEffect, useRef } from 'react'
import CodeMirror from 'codemirror'
import { tw } from 'share/theme'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  singleLine?: boolean
  lineNumbers?: boolean
  onEditorReady?: (editor: CodeMirror.Editor) => void
}

export default function CodeMirrorEditor({
  value,
  onChange,
  className = '',
  placeholder = '',
  singleLine = false,
  lineNumbers = !singleLine,
  onEditorReady,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const cmInstanceRef = useRef<CodeMirror.Editor | null>(null)

  useEffect(() => {
    if (!editorRef.current || cmInstanceRef.current) return

    const editor = CodeMirror(editorRef.current, {
      value: value,
      mode: 'text',
      lineNumbers: lineNumbers,
      lineWrapping: !singleLine,
      theme: 'default',
      placeholder: placeholder,
    })

    editor.on('change', (instance) => {
      onChange(instance.getValue())
    })

    if (singleLine) {
      editor.on('beforeChange', (_instance, change) => {
        const newText = change.text.join('').replace(/\n/g, '')
        if (newText !== change.text.join('')) {
          change.update(change.from, change.to, [newText])
        }
      })
    }

    cmInstanceRef.current = editor

    if (onEditorReady) {
      onEditorReady(editor)
    }

    const refreshEditor = () => {
      requestAnimationFrame(() => {
        editor.refresh()
      })
    }

    const observer = new ResizeObserver(refreshEditor)
    const container = editorRef.current
    observer.observe(container)
    if (container.parentElement) {
      observer.observe(container.parentElement)
    }

    return () => {
      observer.disconnect()
      const editor = cmInstanceRef.current
      if (editor) {
        if (typeof editor.toTextArea === 'function') {
          editor.toTextArea()
        }
        cmInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (cmInstanceRef.current && cmInstanceRef.current.getValue() !== value) {
      const cursor = cmInstanceRef.current.getCursor()
      cmInstanceRef.current.setValue(value)
      cmInstanceRef.current.setCursor(cursor)
    }
  }, [value])

  return <div ref={editorRef} className={`${tw.bg.input} ${className}`} />
}
