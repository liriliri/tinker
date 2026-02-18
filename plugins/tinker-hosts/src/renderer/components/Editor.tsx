import { useEffect, useState, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Monaco, Editor as MonacoEditor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import debounce from 'licia/debounce'
import { tw } from 'share/theme'

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
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const currentIdRef = useRef<string | 'system'>(selectedId)

  // Update current ID ref when selectedId changes
  useEffect(() => {
    currentIdRef.current = selectedId
  }, [selectedId])

  // Create debounced save function
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

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    registerHostsLanguage(monaco)
    // Immediately set the correct theme based on current isDark value
    const theme = isDark ? 'hosts-dark' : 'hosts-light'
    monaco.editor.setTheme(theme)
  }

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)
    // Auto-save after debounce if not readonly
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

      {/* Bottom bar - only show in system view */}
      {isReadonly && (
        <div
          className={`h-[36px] px-4 border-t ${tw.border} flex items-center justify-between flex-shrink-0`}
        >
          {/* Left side - Open Hosts File button */}
          <button
            onClick={handleOpenHostsFile}
            className={`inline-flex items-center h-6 text-xs ${tw.text.both.secondary} px-2 rounded ${tw.hover.both} transition-colors cursor-pointer`}
          >
            {t('openHostsFile')}
          </button>

          {/* Right side - Readonly badge */}
          <span
            className={`inline-flex items-center h-6 text-xs ${tw.text.both.tertiary} ${tw.bg.secondary} px-2 rounded`}
          >
            {t('readonly')}
          </span>
        </div>
      )}
    </div>
  )
})
