import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Loader2, Search } from 'lucide-react'
import className from 'licia/className'
import isStrBlank from 'licia/isStrBlank'
import { tw } from '../../theme'
import type { WebSearchResult } from '../../tools/web'
import { AI_CHAT_NS } from './i18n'

const ICON_SIZE = 14

export interface SearchCardProps {
  query: string
  results: WebSearchResult[]
  error?: string
  isRunning?: boolean
  onOpenResult: (url: string) => void
}

export interface SearchToolMessage {
  data?: unknown
  toolArgs?: Record<string, unknown>
  error?: string
  toolStatus?: string
  generating?: boolean
}

export function getSearchCardProps(
  msg: SearchToolMessage
): Omit<SearchCardProps, 'onOpenResult'> {
  const results = Array.isArray(msg.data) ? (msg.data as WebSearchResult[]) : []
  const query =
    typeof msg.toolArgs?.query === 'string' ? msg.toolArgs.query : ''

  return {
    query,
    results,
    error: msg.error,
    isRunning:
      msg.toolStatus === 'running' || (msg.generating && results.length === 0),
  }
}

export function isSearchMessageRenderable(msg: SearchToolMessage): boolean {
  if (msg.toolStatus === 'running' || msg.generating) return true
  if (!isStrBlank(msg.error ?? '')) return true
  const results = Array.isArray(msg.data) ? msg.data : []
  if (results.length > 0) return true
  const query =
    typeof msg.toolArgs?.query === 'string' ? msg.toolArgs.query : ''
  return !isStrBlank(query)
}

export default function SearchCard({
  query,
  results,
  error,
  isRunning = false,
  onOpenResult,
}: SearchCardProps) {
  const { t } = useTranslation(AI_CHAT_NS)
  const count = results.length
  const isError = Boolean(error)
  const canExpand = !isRunning && !isError && count > 0

  const statusText = isRunning
    ? t('searching')
    : isError
    ? t('searchFailed')
    : `${count} ${t('searchResults')}`

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
          <Search size={ICON_SIZE} />
        </span>
        <span
          className={className(
            'min-w-0 flex-1 truncate font-medium',
            isError ? 'text-red-500 dark:text-red-400' : tw.primary.text
          )}
        >
          {query || t('toolCall')}
        </span>
        <span className="shrink-0">{statusText}</span>
      </summary>

      {canExpand && results.length > 0 && (
        <div
          className={className(
            'mt-1 flex flex-col rounded-md border px-3 py-1.5',
            tw.border,
            tw.bg.primary
          )}
        >
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onOpenResult(result.url)}
              className={className(
                'flex w-full items-start gap-2 border-none bg-transparent px-0 py-1.5 text-left cursor-pointer rounded-sm',
                tw.hover
              )}
            >
              <span
                className={className(
                  'mt-px shrink-0 text-[11px] tabular-nums',
                  tw.text.tertiary
                )}
              >
                {index + 1}.
              </span>
              <span
                className={className(
                  'min-w-0 flex-1 truncate text-xs font-medium',
                  tw.primary.text
                )}
              >
                {result.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </details>
  )
}
