import React, { useEffect, useState, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import MonacoEditor from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import store from '../store'

export const Editor: React.FC = observer(() => {
  const { t } = useTranslation()
  const { config, systemHosts, selectedId, viewMode } = store
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    if (viewMode === 'system') {
      setContent(systemHosts)
    } else if (config && selectedId !== 'system') {
      const selectedConfig = config.configs.find((c) => c.id === selectedId)
      if (selectedConfig) {
        setContent(selectedConfig.content)
      }
    }
  }, [viewMode, systemHosts, config, selectedId])

  const handleSave = async () => {
    if (selectedId === 'system' || viewMode === 'system') return

    setIsSaving(true)
    try {
      store.updateConfig(selectedId as string, content)
      await store.saveConfig()
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
  const selectedConfig = config?.configs.find((c) => c.id === selectedId)
  const title =
    viewMode === 'system' ? t('viewSystemHosts') : selectedConfig?.name || ''

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e]">
      <div className="flex-1 overflow-hidden">
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

      <div className="px-4 py-3 border-t border-gray-300 dark:border-gray-700 flex justify-end">
        {isReadonly ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            {t('readonly')}
          </span>
        ) : (
          <button
            className={`px-4 py-2 text-sm rounded ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
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
