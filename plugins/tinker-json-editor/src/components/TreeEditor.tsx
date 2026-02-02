import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import JSONEditor, { JSONEditorOptions } from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.css'
import filter from 'licia/filter'
import store from '../store'

export default observer(function TreeEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<JSONEditor | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!containerRef.current) return

    // Map i18n language to jsoneditor language
    // jsoneditor uses 'en' for English, but i18n uses 'en-US'
    const languageMap: Record<string, string> = {
      'en-US': 'en',
      'zh-CN': 'zh-CN',
    }
    const editorLanguage = languageMap[i18n.language] || 'en'

    const options: JSONEditorOptions = {
      mode: 'tree',
      modes: ['tree', 'view', 'form'],
      mainMenuBar: false,
      navigationBar: false,
      statusBar: false,
      language: editorLanguage,
      onChangeText: (jsonString: string) => {
        store.setJsonInput(jsonString)
      },
      onCreateMenu: (items) => {
        return filter(
          items,
          (item) =>
            item.className !== 'jsoneditor-sort-asc' &&
            item.className !== 'jsoneditor-transform'
        )
      },
    }

    editorRef.current = new JSONEditor(containerRef.current, options)
    store.setTreeEditorInstance(editorRef.current)

    // Set initial value
    try {
      const json = store.jsonInput ? JSON.parse(store.jsonInput) : {}
      editorRef.current.set(json)
    } catch (err) {
      console.error('Invalid JSON:', err)
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
        store.setTreeEditorInstance(null)
      }
    }
  }, [])

  // Update editor when value changes externally
  useEffect(() => {
    if (editorRef.current) {
      try {
        const json = store.jsonInput ? JSON.parse(store.jsonInput) : {}
        const currentJson = editorRef.current.get()

        // Only update if content is different to avoid cursor jumps
        if (JSON.stringify(currentJson) !== JSON.stringify(json)) {
          editorRef.current.update(json)
        }
      } catch (err) {
        console.error('Invalid JSON:', err)
      }
    }
  }, [store.jsonInput])

  return (
    <div
      ref={containerRef}
      className="w-full h-full jsoneditor-react-container dark:dark-mode"
      style={{
        border: 'none',
      }}
    />
  )
})
