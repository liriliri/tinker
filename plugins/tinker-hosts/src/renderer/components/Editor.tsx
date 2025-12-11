import React, { useEffect, useState, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import MonacoEditor, { Monaco } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import store from '../store'

// Register custom hosts language
const registerHostsLanguage = (monaco: Monaco) => {
  // Check if already registered
  const languages = monaco.languages.getLanguages()
  if (languages.some((lang) => lang.id === 'hosts')) {
    return
  }

  // Register the language
  monaco.languages.register({ id: 'hosts' })

  // Define syntax highlighting rules
  monaco.languages.setMonarchTokensProvider('hosts', {
    tokenizer: {
      root: [
        // Comments
        [/#.*$/, 'comment'],
        // IPv4 addresses
        [
          /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
          'number',
        ],
        // IPv6 addresses (simplified pattern)
        [/\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/, 'number'],
        [/\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b/, 'number'],
        [/\b::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b/, 'number'],
        // Domain names and hostnames
        [/\b[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9]\b/, 'variable'],
        // Whitespace
        [/[ \t\r\n]+/, ''],
      ],
    },
  })

  // Define dark theme for hosts language
  monaco.editor.defineTheme('hosts-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'variable', foreground: '9CDCFE' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
    },
  })

  // Define light theme for hosts language
  monaco.editor.defineTheme('hosts-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'number', foreground: '09885A' },
      { token: 'variable', foreground: '001080' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0B216F',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
    },
  })
}

export default observer(function Editor() {
  const { t } = useTranslation()
  const { configs, systemHosts, selectedId, viewMode, isDark } = store
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

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

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    registerHostsLanguage(monaco)
    // Immediately set the correct theme based on current isDark value
    const theme = isDark ? 'hosts-dark' : 'hosts-light'
    monaco.editor.setTheme(theme)
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
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-white dark:bg-[#1e1e1e]">
        <MonacoEditor
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          language="hosts"
          theme={isDark ? 'hosts-dark' : 'hosts-light'}
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
