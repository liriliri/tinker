import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  Terminal,
  FileText,
  FolderOpen,
  Globe,
  Search,
  Loader2,
} from 'lucide-react'
import { tw } from 'share/theme'
import { getToolLabel } from '../lib/tools'
import type { ChatMessage } from '../types'
import SearchCard from './SearchCard'

interface Props {
  msg: ChatMessage
}

function ToolIcon({ name }: { name: string }) {
  const size = 10
  switch (name) {
    case 'exec':
      return <Terminal size={size} />
    case 'read_file':
    case 'write_file':
    case 'edit_file':
      return <FileText size={size} />
    case 'list_dir':
      return <FolderOpen size={size} />
    case 'web_fetch':
      return <Globe size={size} />
    case 'web_search':
      return <Search size={size} />
    default:
      return <Terminal size={size} />
  }
}

function getArgSummary(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'exec':
      return typeof args.command === 'string'
        ? args.command.slice(0, 60) + (args.command.length > 60 ? '…' : '')
        : ''
    case 'read_file':
    case 'write_file':
    case 'edit_file':
    case 'list_dir':
      return typeof args.path === 'string' ? String(args.path) : ''
    case 'web_search':
      return typeof args.query === 'string' ? String(args.query) : ''
    case 'web_fetch':
      return typeof args.url === 'string' ? String(args.url) : ''
    default:
      return ''
  }
}

export default observer(function ToolCard({ msg }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  // Delegate web_search to SearchCard
  if (msg.toolName === 'web_search') {
    return <SearchCard msg={msg} />
  }

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
              {isRunning && (
                <span className={`shrink-0 leading-none ${tw.text.tertiary}`}>
                  {t('running')}
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
