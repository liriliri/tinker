import { Editor } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { Toolbar } from 'share/components/Toolbar'
import CenteredMessage from './CenteredMessage'
import store from '../store'

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  md: 'markdown',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  swift: 'swift',
  kt: 'kotlin',
  dart: 'dart',
  lua: 'lua',
  toml: 'ini',
  ini: 'ini',
  vue: 'html',
  svelte: 'html',
}

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return LANGUAGE_MAP[ext] || 'plaintext'
}

export default observer(function CommitFileViewer() {
  const { t } = useTranslation()

  if (!store.selectedFilePath) {
    return <CenteredMessage>{t('selectFileToView')}</CenteredMessage>
  }

  const fileName =
    store.selectedFilePath.split('/').pop() || store.selectedFilePath

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      <Toolbar>
        <span className={`text-xs font-mono ${tw.text.secondary}`}>
          {fileName}
        </span>
      </Toolbar>
      <div className="flex-1 min-h-0">
        <Editor
          language={getLanguage(store.selectedFilePath)}
          value={store.fileContent}
          theme={store.isDark ? 'vs-dark' : 'vs-light'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'off',
            renderWhitespace: 'selection',
          }}
        />
      </div>
    </div>
  )
})
