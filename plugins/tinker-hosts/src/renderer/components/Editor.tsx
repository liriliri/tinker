import { useEffect, useState, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Monaco, Editor as MonacoEditor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useTranslation } from 'react-i18next'
import store from '../store'
import debounce from 'licia/debounce'
import { tw } from 'share/theme'

const registerHostsLanguage = (monaco: Monaco) => {
  const languages = monaco.languages.getLanguages()
  if (languages.some((lang) => lang.id === 'hosts')) {
    return
  }

  monaco.languages.register({ id: 'hosts' })

  monaco.languages.setMonarchTokensProvider('hosts', {
    tokenizer: {
      root: [
        [/#.*$/, 'comment'],
        [
          /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
          'number',
        ],
        [/\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/, 'number'],
        [/\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b/, 'number'],
        [/\b::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b/, 'number'],
        [/\b[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9]\b/, 'variable'],
        [/[ \t\r\n]+/, ''],
      ],
    },
  })

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
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const currentIdRef = useRef<string | 'system'>(selectedId)

  useEffect(() => {
    currentIdRef.current = selectedId
  }, [selectedId])

  const debouncedSave = useCallback(
    debounce((id: string, newContent: string) => {
      if (id !== 'system') {
        store.updateConfig(id, newContent)
      }
    }, 500),
    []
  )

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

  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editorInstance
    monacoRef.current = monaco
    registerHostsLanguage(monaco)
    monaco.editor.setTheme(isDark ? 'hosts-dark' : 'hosts-light')
  }

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)
    if (viewMode !== 'system' && currentIdRef.current !== 'system') {
      debouncedSave(currentIdRef.current, newContent)
    }
  }

  const isReadonly = viewMode === 'system'

  const handleOpenHostsFile = () => {
    const hostsPath = hosts.getHostsPath()
    tinker.showItemInPath(hostsPath)
  }

  return (
    <div className={`flex-1 flex flex-col ${tw.bg.primary} min-h-0 min-w-0`}>
      <div
        className={`flex-1 min-h-0 min-w-0 overflow-hidden ${tw.bg.primary}`}
      >
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

      {isReadonly && (
        <div
          className={`h-[36px] px-4 border-t ${tw.border} flex items-center justify-between flex-shrink-0`}
        >
          <button
            onClick={handleOpenHostsFile}
            className={`inline-flex items-center h-6 text-xs ${tw.text.secondary} px-2 rounded ${tw.hover} transition-colors cursor-pointer`}
          >
            {t('openHostsFile')}
          </button>

          <span
            className={`inline-flex items-center h-6 text-xs ${tw.text.tertiary} ${tw.bg.secondary} px-2 rounded`}
          >
            {t('readonly')}
          </span>
        </div>
      )}
    </div>
  )
})
