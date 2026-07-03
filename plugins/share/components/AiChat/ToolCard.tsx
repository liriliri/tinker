import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  FileText,
  FolderOpen,
  Globe,
  Loader2,
  Search,
  Terminal,
} from 'lucide-react'
import { tw } from '../../theme'
import type { ToolStatus } from '../../lib/Agent'
import { AI_CHAT_NS } from './i18n'

const ICON_SIZE = 10

export interface ToolCardMessage {
  toolName?: string
  toolArgs?: Record<string, unknown>
  content?: string
  toolStatus?: ToolStatus
  generating?: boolean
  error?: string
}

export interface ToolCardProps {
  msg: ToolCardMessage
  /** Override the default humanized tool name label. */
  getToolLabel?: (name: string) => string
  /** Override the default argument summary shown beside the label. */
  getArgSummary?: (name: string, args: Record<string, unknown>) => string
  /** Override the default tool icon. */
  getToolIcon?: (name: string) => ReactNode
}

function humanizeToolName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function truncateSummary(value: string, maxLen = 60): string {
  return value.length > maxLen ? `${value.slice(0, maxLen)}…` : value
}

function defaultArgSummary(
  _name: string,
  args: Record<string, unknown>
): string {
  for (const key of ['command', 'path', 'query', 'url', 'text', 'pattern']) {
    const value = args[key]
    if (typeof value === 'string' && value) {
      return truncateSummary(value)
    }
  }
  return ''
}

function DefaultToolIcon({ name }: { name: string }) {
  switch (name) {
    case 'exec':
      return <Terminal size={ICON_SIZE} />
    case 'read_file':
    case 'write_file':
    case 'edit_file':
      return <FileText size={ICON_SIZE} />
    case 'list_dir':
      return <FolderOpen size={ICON_SIZE} />
    case 'web_fetch':
      return <Globe size={ICON_SIZE} />
    case 'web_search':
      return <Search size={ICON_SIZE} />
    default:
      return <Terminal size={ICON_SIZE} />
  }
}

export default function ToolCard({
  msg,
  getToolLabel,
  getArgSummary = defaultArgSummary,
  getToolIcon,
}: ToolCardProps) {
  const { t } = useTranslation(AI_CHAT_NS)
  const [expanded, setExpanded] = useState(false)

  const toolName = msg.toolName ?? ''
  const args = msg.toolArgs ?? {}
  const label = toolName
    ? getToolLabel?.(toolName) ?? humanizeToolName(toolName)
    : t('toolCall')
  const summary = toolName ? getArgSummary(toolName, args) : ''
  const isRunning = msg.toolStatus === 'running' || msg.generating
  const isError =
    Boolean(msg.error) ||
    msg.toolStatus === 'error' ||
    (msg.content?.startsWith('Error') ?? false)
  const result = msg.error ?? msg.content
  const canExpand = !isRunning && Boolean(result)

  return (
    <div
      className={`overflow-hidden rounded-lg border text-[11px] ${tw.border} ${tw.bg.secondary}`}
    >
      <button
        type="button"
        onClick={() => canExpand && setExpanded((value) => !value)}
        className={`w-full px-2.5 py-2 text-left ${canExpand ? tw.hover : ''}`}
        disabled={!canExpand}
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
              <Loader2 size={ICON_SIZE} className="animate-spin" />
            ) : getToolIcon ? (
              getToolIcon(toolName)
            ) : (
              <DefaultToolIcon name={toolName} />
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
                  className={`min-w-0 flex-1 truncate font-mono leading-4 ${tw.text.tertiary}`}
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
          {canExpand && (
            <ChevronDown
              size={12}
              className={`shrink-0 transition-transform ${tw.text.tertiary} ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {expanded && result && (
        <div className={`border-t px-2.5 py-2 ${tw.border}`}>
          <pre
            className={`max-h-60 overflow-y-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed ${tw.text.secondary}`}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}
