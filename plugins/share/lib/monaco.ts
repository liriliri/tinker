import { loader } from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'

export type MonacoApi = typeof import('monaco-editor')

const DIFF_THEME_RULES = {
  'vs-dark': {
    header: '#569cd6',
    range: '#c586c0',
    inserted: '#6a9955',
    deleted: '#f44747',
  },
  vs: {
    header: '#0451a5',
    range: '#795e26',
    inserted: '#098658',
    deleted: '#a31515',
  },
} as const

export const READ_ONLY_EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'off' as const,
}

let diffLanguageRegistered = false
let monacoApi: MonacoApi | null = null
let monacoInitPromise: Promise<MonacoApi> | null = null

export function getMonacoApi(): MonacoApi | null {
  return monacoApi
}

function disableMonacoValidation(monaco: Monaco): void {
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
}

function extendDiffThemes(monaco: Monaco): void {
  for (const base of ['vs', 'vs-dark'] as const) {
    const colors = DIFF_THEME_RULES[base]
    monaco.editor.defineTheme(base, {
      base,
      inherit: true,
      rules: [
        { token: 'diff.header', foreground: colors.header },
        { token: 'diff.range', foreground: colors.range },
        { token: 'diff.inserted', foreground: colors.inserted },
        { token: 'diff.deleted', foreground: colors.deleted },
      ],
      colors: {},
    })
  }
}

function registerDiffLanguage(monaco: Monaco): void {
  if (diffLanguageRegistered) return
  diffLanguageRegistered = true

  const hasDiffLanguage = monaco.languages
    .getLanguages()
    .some((language) => language.id === 'diff')

  if (!hasDiffLanguage) {
    monaco.languages.register({
      id: 'diff',
      extensions: ['.diff', '.patch'],
      aliases: ['Diff', 'diff', 'patch'],
    })

    monaco.languages.setMonarchTokensProvider('diff', {
      defaultToken: '',
      tokenizer: {
        root: [
          [/^diff --git .*$/, 'diff.header'],
          [/^index [0-9a-f]{7,40}\.\.[0-9a-f]{7,40}.*$/, 'diff.header'],
          [/^--- .*$/, 'diff.header'],
          [/^\+\+\+ .*$/, 'diff.header'],
          [/^@@ .* @@.*$/, 'diff.range'],
          [/^\+.*$/, 'diff.inserted'],
          [/^-.*$/, 'diff.deleted'],
        ],
      },
    })
  }

  extendDiffThemes(monaco)
}

export function configureMonacoEditor(monaco: Monaco): void {
  disableMonacoValidation(monaco)
  registerDiffLanguage(monaco)
}

export function initMonacoApi(): Promise<MonacoApi> {
  if (monacoInitPromise) return monacoInitPromise

  monacoInitPromise = loader.init().then((monaco) => {
    configureMonacoEditor(monaco as Monaco)
    monacoApi = monaco as MonacoApi
    return monacoApi
  })

  return monacoInitPromise
}
