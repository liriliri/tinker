import { useRef, useEffect, useCallback } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'

export interface BlameLineAnnotation {
  lineNumber: number
  isLeader: boolean
  sha: string
  text: string
  date: string
  dateTitle?: string
}

interface UseBlameDecorationsOptions {
  editorRef: React.MutableRefObject<MonacoEditor.IStandaloneCodeEditor | null>
  monacoApi: typeof import('monaco-editor') | null
  annotations: BlameLineAnnotation[]
  highlightedSha: string | null
  showBlame: boolean
  onHighlightClick: (sha: string) => void
}

export function useBlameDecorations({
  editorRef,
  monacoApi,
  annotations,
  highlightedSha,
  showBlame,
  onHighlightClick,
}: UseBlameDecorationsOptions): void {
  const decorationIdsRef = useRef<string[]>([])
  const highlightDecoIdsRef = useRef<string[]>([])

  // Apply blame decorations (before content for text, className for highlight)
  const applyBlameDecorations = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !monacoApi) return

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      []
    )

    if (!showBlame || annotations.length === 0) {
      return
    }

    const decorations: MonacoEditor.IModelDeltaDecoration[] = []
    for (const a of annotations) {
      const base = {
        range: new monacoApi.Range(a.lineNumber, 1, a.lineNumber, 1),
      }
      const hl = highlightedSha && a.sha === highlightedSha
      if (a.isLeader) {
        decorations.push({
          ...base,
          options: {
            showIfCollapsed: true,
            before: {
              content: a.text,
              inlineClassName: hl
                ? 'blame-before blame-before--msg blame-before--hl'
                : 'blame-before blame-before--msg',
            },
          },
        })
        decorations.push({
          ...base,
          options: {
            showIfCollapsed: true,
            hoverMessage: a.dateTitle ? { value: a.dateTitle } : undefined,
            before: {
              content: a.date,
              inlineClassName: hl
                ? 'blame-before blame-before--date blame-before--hl'
                : 'blame-before blame-before--date',
            },
          },
        })
      } else {
        decorations.push({
          ...base,
          options: {
            showIfCollapsed: true,
            before: {
              content: '\u00a0',
              inlineClassName: hl
                ? 'blame-before blame-before--compact blame-before--hl'
                : 'blame-before blame-before--compact',
            },
          },
        })
      }
    }

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      decorations
    )
  }, [editorRef, monacoApi, annotations, highlightedSha, showBlame])

  // Apply highlight decorations for selected SHA
  const applyHighlightDecorations = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !monacoApi) return

    highlightDecoIdsRef.current = editor.deltaDecorations(
      highlightDecoIdsRef.current,
      []
    )

    const sha = highlightedSha
    if (!sha || !showBlame) return

    const lines = annotations.filter((a) => a.sha === sha)
    if (lines.length === 0) return

    const decos: MonacoEditor.IModelDeltaDecoration[] = lines.map((a) => ({
      range: new monacoApi.Range(a.lineNumber, 1, a.lineNumber, 1),
      options: {
        description: 'git-blame-highlight',
        isWholeLine: true,
        className: 'blame-line-highlight',
      },
    }))

    highlightDecoIdsRef.current = editor.deltaDecorations(
      highlightDecoIdsRef.current,
      decos
    )
  }, [editorRef, monacoApi, annotations, highlightedSha, showBlame])

  // Apply decorations when blame or annotations change
  useEffect(() => {
    applyBlameDecorations()
    applyHighlightDecorations()
    return () => {
      const editor = editorRef.current
      if (editor) {
        editor.deltaDecorations(decorationIdsRef.current, [])
        editor.deltaDecorations(highlightDecoIdsRef.current, [])
        decorationIdsRef.current = []
        highlightDecoIdsRef.current = []
      }
    }
  }, [applyBlameDecorations, applyHighlightDecorations])

  // Mouse click handler — detect clicks on lines and call onHighlightClick
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const disposable = editor.onMouseDown((e) => {
      if (!e.target.position || !showBlame) return
      const lineNumber = e.target.position.lineNumber
      const annotation = annotations.find((a) => a.lineNumber === lineNumber)
      if (annotation) {
        onHighlightClick(annotation.sha)
      }
    })

    return () => disposable.dispose()
  }, [editorRef, annotations, showBlame, onHighlightClick])
}
