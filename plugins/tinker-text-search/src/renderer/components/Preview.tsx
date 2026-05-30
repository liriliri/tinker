import { Editor, loader } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { File } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import { getLanguage } from '../lib/language'
import { byteRangeToColumns, getLineText } from '../lib/highlight'

type MonacoApi = typeof import('monaco-editor')

let monacoApi: MonacoApi | null = null
loader.init().then((m) => {
  monacoApi = m as MonacoApi
})

const Preview = observer(function Preview() {
  const { t } = useTranslation()
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const decoIdsRef = useRef<string[]>([])

  const am = store.activeMatch
  const path = store.previewPath
  const content = store.previewContent

  useEffect(() => {
    const ed = editorRef.current
    if (!ed || !monacoApi || !am) return
    if (path !== am.path) return

    const lineText = getLineText(content, am.lineNumber)
    const decorations: MonacoEditor.IModelDeltaDecoration[] = [
      {
        range: new monacoApi.Range(am.lineNumber, 1, am.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'tts-line-active',
        },
      },
      ...am.submatches.map((sm) => {
        const { startColumn, endColumn } = byteRangeToColumns(
          lineText,
          sm.start,
          sm.end
        )
        return {
          range: new monacoApi!.Range(
            am.lineNumber,
            startColumn,
            am.lineNumber,
            endColumn
          ),
          options: {
            inlineClassName: 'tts-match-inline',
          },
        } as MonacoEditor.IModelDeltaDecoration
      }),
    ]

    decoIdsRef.current = ed.deltaDecorations(decoIdsRef.current, decorations)
    ed.revealLineInCenter(am.lineNumber)
  }, [path, am?.path, am?.lineNumber, am?.submatches, content])

  if (!am || (!path && !store.previewLoading)) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center ${tw.bg.primary}`}
      >
        <File
          className={`w-10 h-10 mb-3 ${tw.gray.text400}`}
          strokeWidth={1.5}
        />
        <p className={`text-xs ${tw.text.tertiary}`}>{t('previewEmpty')}</p>
      </div>
    )
  }

  if (store.previewError) {
    return (
      <div
        className={`h-full flex items-center justify-center ${tw.bg.primary}`}
      >
        <p className={`text-xs ${tw.text.tertiary}`}>
          {t('previewError', { message: store.previewError })}
        </p>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${tw.bg.primary}`}>
      <div
        className={`shrink-0 px-3 py-1.5 border-b ${tw.border} text-xs ${tw.text.secondary} truncate`}
        title={path}
      >
        {path}
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          path={path}
          language={getLanguage(path)}
          value={content}
          theme={store.isDark ? 'vs-dark' : 'vs'}
          onMount={(instance) => {
            editorRef.current = instance
          }}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'off',
            renderWhitespace: 'selection',
            domReadOnly: true,
          }}
        />
      </div>
    </div>
  )
})

export default Preview
