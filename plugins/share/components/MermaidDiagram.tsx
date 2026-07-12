import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import { Loader2 } from 'lucide-react'
import { tw } from '../theme'

export interface MermaidDiagramProps {
  source: string
  isDark: boolean
}

let lastTheme: 'default' | 'dark' | null = null
let renderQueue: Promise<void> = Promise.resolve()

function renderMermaid(source: string, isDark: boolean): Promise<string> {
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
    const result = await mermaid.render(id, source.trim())
    return result.svg
  }

  const task = renderQueue.then(run, run)
  renderQueue = task.then(
    () => undefined,
    () => undefined
  )
  return task
}

export default function MermaidDiagram({
  source,
  isDark,
}: MermaidDiagramProps) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    renderMermaid(source, isDark)
      .then((nextSvg) => {
        if (cancelled) return
        setSvg(nextSvg)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setSvg('')
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [source, isDark])

  if (loading) {
    return (
      <div
        className={`inline-flex items-center gap-2 my-3 px-3 py-2 rounded border ${tw.border} ${tw.text.secondary}`}
      >
        <Loader2 size={16} className="animate-spin" />
        <span>Loading diagram...</span>
      </div>
    )
  }

  if (error || !svg) {
    return (
      <pre
        className={`my-3 p-3 rounded overflow-x-auto text-xs font-mono ${tw.bg.secondary} ${tw.text.secondary}`}
      >
        {source}
      </pre>
    )
  }

  return (
    <div
      className="my-4 overflow-x-auto [&_svg]:max-w-full"
      // Mermaid output is sanitized internally; browsers also do not execute SVG scripts.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
