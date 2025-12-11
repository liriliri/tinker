import React, { useEffect, useState, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import MonacoEditor from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function Editor() {
  const { t } = useTranslation()
  const { configs, systemHosts, selectedId, viewMode } = store
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    if (viewMode === 'system') {
      setContent(systemHosts)
    } else if (selectedId !== 'system') {
      const selectedConfig = configs.find((c) => c.id === selectedId)
      if (selectedConfig) {
        setContent(selectedConfig.content)
      }
    }
  }, [viewMode, systemHosts, configs, selectedId])

  const handleSave = async () => {
    if (selectedId === 'system' || viewMode === 'system') return

    setIsSaving(true)
    try {
      store.updateConfig(selectedId as string, content)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  const handleEditorChange = (value: string | undefined) => {
    setContent(value || '')
  }

  const isReadonly = viewMode === 'system'
  const selectedConfig = configs.find((c) => c.id === selectedId)
  const title =
    viewMode === 'system' ? t('viewSystemHosts') : selectedConfig?.name || ''

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] min-h-0 min-w-0">
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <MonacoEditor
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          language="plaintext"
          theme="vs-dark"
          options={{
            readOnly: isReadonly,
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'off',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'none',
          }}
        />
      </div>

      <div className="h-[60px] px-4 border-t border-[#e0e0e0] dark:border-[#4a4a4a] flex items-center justify-end flex-shrink-0 min-w-0 overflow-x-auto">
        {isReadonly ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-300 dark:bg-[#4a4a4a] px-2 py-1 rounded">
            {t('readonly')}
          </span>
        ) : (
          <button
            className={`px-4 py-2 text-sm rounded whitespace-nowrap ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#0fc25e] hover:bg-[#0db350]'
            } text-white`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('saving') : t('save')}
          </button>
        )}
      </div>
    </div>
  )
})
