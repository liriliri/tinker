import type { ReactNode, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  FileText,
  FolderOpen,
  Globe,
  Loader2,
  Search,
  Terminal,
  WandSparkles,
} from 'lucide-react'
import className from 'licia/className'
import isStrBlank from 'licia/isStrBlank'
import { tw } from '../../theme'
import type { ToolStatus } from '../../lib/Agent'
import { AI_CHAT_NS } from './i18n'

const ICON_SIZE = 14

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

function defaultArgSummary(
  _name: string,
  args: Record<string, unknown>
): string {
  for (const key of [
    'command',
    'content',
    'path',
    'query',
    'url',
    'text',
    'pattern',
    'outputPath',
  ]) {
    const value = args[key]
    if (typeof value === 'string' && value) {
      return value
    }
  }
  return ''
}

function DefaultToolIcon({ name }: { name: string }) {
  switch (name) {
    case 'exec':
    case 'run_command':
    case 'write_to_terminal':
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
      return <WandSparkles size={ICON_SIZE} />
  }
}

export function isToolMessageRenderable(msg: ToolCardMessage): boolean {
  if (msg.toolStatus === 'running' || msg.generating) return true
  if (!isStrBlank(msg.error ?? '')) return true
  if (!isStrBlank(msg.content ?? '')) return true
  return false
}

export default function ToolCard({
  msg,
  getToolLabel,
  getArgSummary = defaultArgSummary,
  getToolIcon,
}: ToolCardProps) {
  const { t } = useTranslation(AI_CHAT_NS)

  if (!isToolMessageRenderable(msg)) {
    return null
  }

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

  const handleSummaryClick = (e: MouseEvent<HTMLElement>) => {
    if (!canExpand) e.preventDefault()
  }

  return (
    <details
      className={className(
        'group/tool w-full text-xs font-mono',
        tw.text.tertiary
      )}
    >
      <summary
        onClick={handleSummaryClick}
        className={className(
          'flex list-none items-center gap-2 rounded-sm px-1 py-1.5 select-none [&::-webkit-details-marker]:hidden',
          canExpand ? `cursor-pointer ${tw.hover}` : 'cursor-default'
        )}
      >
        {isRunning ? (
          <Loader2
            size={ICON_SIZE}
            className={className('shrink-0 animate-spin', tw.primary.text)}
          />
        ) : (
          <ChevronRight
            size={ICON_SIZE}
            className={className(
              'shrink-0 transition-transform group-open/tool:rotate-90',
              canExpand ? '' : 'opacity-0'
            )}
          />
        )}
        <span
          className={className(
            'shrink-0',
            isError ? 'text-red-500 dark:text-red-400' : tw.primary.text
          )}
        >
          {getToolIcon ? (
            getToolIcon(toolName)
          ) : (
            <DefaultToolIcon name={toolName} />
          )}
        </span>
        <span
          className={className(
            'shrink-0 font-medium',
            isError ? 'text-red-500 dark:text-red-400' : tw.primary.text
          )}
        >
          {label}
        </span>
        {isRunning && <span className="shrink-0">{t('running')}</span>}
        {summary && (
          <span title={summary} className="min-w-0 flex-1 truncate">
            {summary}
          </span>
        )}
      </summary>

      {canExpand && result && (
        <div
          className={className(
            'mt-1 max-h-64 overflow-auto rounded-md border px-3 py-2',
            tw.border,
            tw.bg.primary
          )}
        >
          <pre
            className={className(
              'm-0 whitespace-pre-wrap break-all',
              isError ? 'text-red-500 dark:text-red-400' : tw.text.primary
            )}
          >
            {result}
          </pre>
        </div>
      )}
    </details>
  )
}
