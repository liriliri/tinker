import { useEffect, useMemo, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { AlertCircle, Loader2 } from 'lucide-react'
import className from 'licia/className'
import debounce from 'licia/debounce'
import { tw } from '../theme'

export interface MermaidDiagramStatus {
  loading: boolean
  error: string | null
  hasDiagram: boolean
}

export interface MermaidDiagramProps {
  source: string
  isDark: boolean
  className?: string
  debounceMs?: number
  /**
   * `fallback` shows the source on error (default, for markdown embeds).
   * `error` fills the container with a red error panel.
   * `none` lets the parent render errors.
   */
  errorDisplay?: 'fallback' | 'error' | 'none'
  hideLoading?: boolean
  onStatusChange?: (status: MermaidDiagramStatus) => void
}

interface MermaidRenderResult {
  svg: string
  bindFunctions?: (element: Element) => void
}

let lastTheme: 'default' | 'dark' | null = null
let renderQueue: Promise<void> = Promise.resolve()

function renderMermaid(
  source: string,
  isDark: boolean
): Promise<MermaidRenderResult> {
  const run = async () => {
    const theme = isDark ? 'dark' : 'default'
    if (lastTheme !== theme) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme,
      })
      lastTheme = theme
    }

    const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`
    return await mermaid.render(id, source.trim())
  }

  const task = renderQueue.then(run, run)
  renderQueue = task.then(
    () => undefined,
    () => undefined
  )
  return task
}

function applyMermaidSvg(
  container: HTMLElement,
  result: MermaidRenderResult
): void {
  container.innerHTML = result.svg
  const graph = container.querySelector('svg')
  if (!graph) return

  const viewBox = graph.viewBox?.baseVal
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    graph.setAttribute('width', String(viewBox.width))
    graph.setAttribute('height', String(viewBox.height))
  }
  graph.style.maxWidth = '100%'
  graph.style.maxHeight = '100%'
  graph.style.width = 'auto'
  graph.style.height = 'auto'

  if (result.bindFunctions) {
    result.bindFunctions(graph)
  }
}

export default function MermaidDiagram({
  source,
  isDark,
  className: extraClassName = '',
  debounceMs = 0,
  errorDisplay = 'fallback',
  hideLoading = false,
  onStatusChange,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<MermaidRenderResult | null>(null)
  const [hasDiagram, setHasDiagram] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderToken, setRenderToken] = useState(0)
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  const emitStatus = (status: MermaidDiagramStatus) => {
    onStatusChangeRef.current?.(status)
  }

  const runRender = useMemo(() => {
    const render = async (nextSource: string, nextIsDark: boolean) => {
      const trimmed = nextSource.trim()
      if (!trimmed) {
        resultRef.current = null
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }
        setHasDiagram(false)
        setError(null)
        setLoading(false)
        setRenderToken((token) => token + 1)
        emitStatus({ loading: false, error: null, hasDiagram: false })
        return
      }

      setLoading(true)
      setError(null)
      emitStatus({
        loading: true,
        error: null,
        hasDiagram: !!resultRef.current,
      })

      try {
        const result = await renderMermaid(trimmed, nextIsDark)
        resultRef.current = result
        setHasDiagram(true)
        setError(null)
        setLoading(false)
        setRenderToken((token) => token + 1)
        emitStatus({ loading: false, error: null, hasDiagram: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (errorDisplay !== 'none') {
          resultRef.current = null
          if (containerRef.current) {
            containerRef.current.innerHTML = ''
          }
          setHasDiagram(false)
        }
        setError(message)
        setLoading(false)
        setRenderToken((token) => token + 1)
        emitStatus({
          loading: false,
          error: message,
          hasDiagram: errorDisplay === 'none' ? !!resultRef.current : false,
        })
      }
    }

    if (debounceMs > 0) {
      return debounce(render, debounceMs)
    }
    return render
  }, [debounceMs, errorDisplay])

  useEffect(() => {
    runRender(source, isDark)
  }, [source, isDark, runRender])

  useEffect(() => {
    const result = resultRef.current
    if (!containerRef.current || !result) return
    applyMermaidSvg(containerRef.current, result)
  }, [renderToken, hasDiagram])

  const showInlineLoading =
    !hideLoading && loading && !hasDiagram && errorDisplay === 'fallback'

  const showErrorPanel =
    errorDisplay === 'error' && !!error && !loading && !hasDiagram

  const showFallback = errorDisplay === 'fallback' && !hasDiagram && !loading

  if (showInlineLoading) {
    return (
      <div
        className={className(
          `inline-flex items-center gap-2 my-3 px-3 py-2 rounded border ${tw.border} ${tw.text.secondary}`,
          extraClassName
        )}
      >
        <Loader2 size={16} className="animate-spin" />
        <span>Loading diagram...</span>
      </div>
    )
  }

  if (showErrorPanel) {
    return (
      <div
        className={className(
          'h-full w-full overflow-auto bg-red-50 dark:bg-red-950/90',
          extraClassName
        )}
      >
        <div className="flex items-start gap-3 p-6 min-h-full">
          <AlertCircle
            size={18}
            className="shrink-0 mt-0.5 text-red-500 dark:text-red-400"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              Syntax Error
            </div>
            <pre
              className={`mt-2 text-xs font-mono whitespace-pre-wrap break-words leading-relaxed ${tw.text.secondary}`}
            >
              {error}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  if (showFallback) {
    return (
      <pre
        className={className(
          `my-3 p-3 rounded overflow-x-auto text-xs font-mono ${tw.bg.secondary} ${tw.text.secondary}`,
          extraClassName
        )}
      >
        {source}
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className(
        errorDisplay === 'fallback'
          ? 'my-4 overflow-x-auto [&_svg]:max-w-full'
          : 'h-full w-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full',
        extraClassName
      )}
    />
  )
}
