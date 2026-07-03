import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { ChevronDown, FileText, Loader2, Terminal } from 'lucide-react'
import { tw } from 'share/theme'
import { getToolLabel } from '../../lib/chatTools'
import type { ChatMessage } from '../../types/chat'

interface Props {
  msg: ChatMessage
}

function ToolIcon({ name }: { name: string }) {
  const size = 10
  if (name === 'get_test_text' || name === 'set_test_text') {
    return <FileText size={size} />
  }
  return <Terminal size={size} />
}

function getArgSummary(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'set_regexp': {
      const pattern = typeof args.pattern === 'string' ? args.pattern : ''
      const flags = typeof args.flags === 'string' ? args.flags : ''
      const summary = flags ? `/${pattern}/${flags}` : pattern
      return summary.length > 60 ? `${summary.slice(0, 60)}…` : summary
    }
    case 'set_test_text': {
      const text = typeof args.text === 'string' ? args.text : ''
      return text.length > 60 ? `${text.slice(0, 60)}…` : text
    }
    default:
      return ''
  }
}

export default observer(function ToolCard({ msg }: Props) {
  const [expanded, setExpanded] = useState(false)

  const toolName = msg.toolName ?? ''
  const args = msg.toolArgs ?? {}
  const label = getToolLabel(toolName)
  const summary = getArgSummary(toolName, args)
  const isRunning = msg.toolStatus === 'running' || msg.generating
  const isError =
    msg.toolStatus === 'error' || (msg.content?.startsWith('Error') ?? false)

  return (
    <div
      className={`overflow-hidden rounded-xl border text-[11px] ${tw.border} ${tw.bg.secondary}`}
    >
      <button
        onClick={() => !isRunning && setExpanded((v) => !v)}
        className={`w-full px-2.5 py-2 text-left ${isRunning ? '' : tw.hover}`}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              isError
                ? 'bg-red-500 dark:bg-red-600'
                : isRunning
                ? `${tw.primary.bg} opacity-70`
                : tw.primary.bg
            } text-white`}
          >
            {isRunning ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <ToolIcon name={toolName} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`shrink-0 font-medium leading-4 ${
                  isError ? 'text-red-500 dark:text-red-400' : tw.text.primary
                }`}
              >
                {label}
              </span>
              {summary && (
                <span
                  className={`min-w-0 flex-1 truncate leading-4 font-mono ${tw.text.tertiary}`}
                >
                  {summary}
                </span>
              )}
            </div>
          </div>
          {!isRunning && msg.content && (
            <ChevronDown
              size={12}
              className={`shrink-0 transition-transform ${tw.text.tertiary} ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {expanded && msg.content && (
        <div className={`border-t px-2.5 py-2 ${tw.border}`}>
          <pre
            className={`whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed ${tw.text.secondary} max-h-60 overflow-y-auto`}
          >
            {msg.content}
          </pre>
        </div>
      )}
    </div>
  )
})
